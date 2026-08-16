import * as React from "react";
import { exportPayloadToString, importStringToPayload } from "@/lib/dataCodec";
import { importPayloadForWorkspace } from "@/lib/importExportKinds";
import {
  applyImportSelectionToggle,
  buildImportPreviewSections,
  buildImportPreviewSectionsAsync,
  collectAllImportKeys,
  countImportPreviewRows,
  filterMonoPayloadBySelection,
  filterWorkspaceBundleBySelection,
  totalMonoSelectedRecords,
  totalSelectedRecords,
  type ImportPreviewSection,
} from "@/lib/importBundleImportPreview";
import { TextareaWithCopyButton } from "@/components/TextareaWithCopyButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DataManagerClientsSection } from "@/features/dataManager/DataManagerClientsSection";
import { DataManagerImportPreviewPane } from "@/features/dataManager/DataManagerImportPreviewPane";
import type { DataManagerBundle } from "@/features/dataManager/useDataManagerWorkspaceData";
import {
  buildWorkspaceExportPayload,
  isMonoKindPayload,
  isWorkspaceBundlePayload,
  selectedIdsByExportKind,
} from "@/lib/workspaceBundle";
import { importWorkspaceBundle } from "@/lib/workspaceBundleImport";
import { dataManagerFileUploadButtonClassName } from "@/features/dataManager/fileUploadButtonStyles";

const MODULE_LABELS: Record<string, string> = {
  categories: "Catégories",
  "tax-rates": "Taux TVA",
  snippets: "Textes enregistrés",
  "discount-presets": "Modèles de réduction",
  articles: "Articles",
  clients: "Clients",
  projects: "Projets",
  quotes: "Devis",
  invoices: "Factures",
};

/** Au-delà, construction d’aperçu asynchrone + indicateur de progression. */
const PREVIEW_ASYNC_ROW_THRESHOLD = 72;

type ImportSourceTab = "bundle" | "clientsCsv";
type ExportSelectionView = "summary" | "detailed";

export function DataManagerWorkspacePanel({
  workspaceId,
  workspaceName,
  bundle,
  sidebarSelection,
  onRefresh,
  compact,
  baseCurrency,
}: {
  workspaceId: string;
  workspaceName: string;
  bundle: DataManagerBundle;
  sidebarSelection: Map<string, Set<string>>;
  onRefresh: () => void;
  compact?: boolean;
  baseCurrency: string;
}) {
  const [importSource, setImportSource] =
    React.useState<ImportSourceTab>("bundle");
  const [panel, setPanel] = React.useState<"import" | "export">("import");
  const [includeAllWhenNoSelection, setIncludeAllWhenNoSelection] =
    React.useState(false);
  const [importText, setImportText] = React.useState("");
  const [decoded, setDecoded] = React.useState<unknown | null>(null);
  const [decodeError, setDecodeError] = React.useState<string | null>(null);
  const [exportEncoded, setExportEncoded] = React.useState("");
  const [exportSelectionView, setExportSelectionView] =
    React.useState<ExportSelectionView>("detailed");

  const [importPreviewSections, setImportPreviewSections] = React.useState<
    ImportPreviewSection[]
  >([]);
  const [importPreviewBuilding, setImportPreviewBuilding] =
    React.useState(false);
  const [importPreviewProgress, setImportPreviewProgress] =
    React.useState("");
  const [importSelectedKeys, setImportSelectedKeys] = React.useState<
    Set<string>
  >(() => new Set());

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const byKind = React.useMemo(
    () => selectedIdsByExportKind(sidebarSelection),
    [sidebarSelection],
  );

  const allIdsByKind = React.useMemo(
    () => ({
      categories: bundle.categories.map((c) => c.id),
      "tax-rates": bundle.taxRates.map((t) => t.id),
      snippets: bundle.snippets.map((s) => s.id),
      "discount-presets": bundle.presets.map((p) => p.id),
      articles: bundle.articles.map((a) => a.id),
      clients: bundle.clients.map((c) => c.id),
      projects: bundle.projects.map((p) => p.id),
      quotes: bundle.quotes.map((q) => q.id),
      invoices: bundle.invoices.map((i) => i.id),
    }),
    [bundle],
  );

  const effectiveIdsByKind = React.useMemo(() => {
    const out = new Map<string, Set<string>>();
    for (const kind of Object.keys(allIdsByKind)) {
      const selected = byKind.get(kind) ?? new Set<string>();
      if (selected.size > 0) {
        out.set(kind, new Set(selected));
      } else if (includeAllWhenNoSelection) {
        out.set(kind, new Set(allIdsByKind[kind as keyof typeof allIdsByKind]));
      }
    }
    return out;
  }, [allIdsByKind, byKind, includeAllWhenNoSelection]);

  const anyEffectiveExportSelection = React.useMemo(() => {
    for (const ids of effectiveIdsByKind.values()) {
      if (ids.size > 0) return true;
    }
    return false;
  }, [effectiveIdsByKind]);

  const labelsByKind = React.useMemo(() => {
    const tax = new Map(bundle.taxRates.map((x) => [x.id, `${x.name} (${x.rate} %)`] as const));
    const snippets = new Map(bundle.snippets.map((x) => [x.id, x.name] as const));
    const presets = new Map(
      bundle.presets.map((x) => {
        const suffix = x.kind === "percent" ? `${x.value} %` : `${x.value}`;
        return [x.id, `${x.name} (${suffix})`] as const;
      }),
    );
    const clients = new Map(bundle.clients.map((x) => [x.id, x.name] as const));
    const quotes = new Map(
      bundle.quotes.map((x) => {
        const label = x.title?.trim()
          ? `Devis ${x.number} — ${x.title}`
          : `Devis ${x.number}`;
        return [x.id, label] as const;
      }),
    );
    const invoices = new Map(
      bundle.invoices.map((x) => [x.id, `Facture ${x.number}`] as const),
    );
    const projects = new Map(
      bundle.projects.map((x) => {
        const code = x.code?.trim();
        return [x.id, code ? `${x.name} (${code})` : x.name] as const;
      }),
    );
    return {
      "tax-rates": tax,
      snippets,
      "discount-presets": presets,
      clients,
      projects,
      quotes,
      invoices,
    };
  }, [bundle]);

  const selectedArticlesByCategory = React.useMemo(() => {
    const selected = effectiveIdsByKind.get("articles") ?? new Set<string>();
    const out = new Map<string | null, typeof bundle.articles>();
    for (const a of bundle.articles) {
      if (!selected.has(a.id)) continue;
      const k = a.categoryId ?? null;
      const arr = out.get(k) ?? [];
      arr.push(a);
      out.set(k, arr);
    }
    for (const arr of out.values()) {
      arr.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    }
    return out;
  }, [bundle.articles, effectiveIdsByKind]);

  const visibleCategoryIds = React.useMemo(() => {
    const selectedCategories = effectiveIdsByKind.get("categories") ?? new Set<string>();
    const byParent = new Map<string | null, string[]>();
    const byId = new Map(bundle.categories.map((c) => [c.id, c] as const));
    for (const c of bundle.categories) {
      const p = c.parentId ?? null;
      const arr = byParent.get(p) ?? [];
      arr.push(c.id);
      byParent.set(p, arr);
    }
    for (const ids of byParent.values()) {
      ids.sort((a, b) => {
        const ca = byId.get(a);
        const cb = byId.get(b);
        if (!ca || !cb) return a.localeCompare(b, "fr");
        if (ca.sortOrder !== cb.sortOrder) return ca.sortOrder - cb.sortOrder;
        return ca.name.localeCompare(cb.name, "fr");
      });
    }
    const keep = new Set<string>();
    const walk = (id: string): boolean => {
      const hasDirectArticles = (selectedArticlesByCategory.get(id) ?? []).length > 0;
      let hasChild = false;
      for (const childId of byParent.get(id) ?? []) {
        if (walk(childId)) hasChild = true;
      }
      const selected = selectedCategories.has(id);
      const visible = selected || hasDirectArticles || hasChild;
      if (visible) keep.add(id);
      return visible;
    };
    for (const rootId of byParent.get(null) ?? []) {
      walk(rootId);
    }
    return { ids: keep, byParent, byId };
  }, [bundle.categories, effectiveIdsByKind, selectedArticlesByCategory]);

  React.useEffect(() => {
    if (
      !decoded ||
      (!isWorkspaceBundlePayload(decoded) && !isMonoKindPayload(decoded))
    ) {
      setImportPreviewSections([]);
      setImportSelectedKeys(new Set());
      setImportPreviewBuilding(false);
      setImportPreviewProgress("");
      return;
    }

    let cancelled = false;
    setImportPreviewSections([]);
    setImportSelectedKeys(new Set());

    const rowCount = countImportPreviewRows(decoded);
    const useAsync = rowCount >= PREVIEW_ASYNC_ROW_THRESHOLD;

    if (useAsync) {
      setImportPreviewBuilding(true);
      setImportPreviewProgress("");
    }

    const applySections = (sections: ImportPreviewSection[]) => {
      if (cancelled) return;
      setImportPreviewSections(sections);
      setImportSelectedKeys(new Set(collectAllImportKeys(sections)));
      setImportPreviewBuilding(false);
      setImportPreviewProgress("");
    };

    if (useAsync) {
      void buildImportPreviewSectionsAsync(
        decoded,
        baseCurrency,
        (msg) => {
          if (!cancelled) setImportPreviewProgress(msg);
        },
      ).then((sections) => {
        applySections(sections);
      });
    } else {
      applySections(buildImportPreviewSections(decoded, baseCurrency));
    }

    return () => {
      cancelled = true;
    };
  }, [decoded, baseCurrency]);

  const canImport = React.useMemo(() => {
    if (!decoded || importPreviewBuilding) return false;
    if (isWorkspaceBundlePayload(decoded)) {
      return totalSelectedRecords(decoded, importSelectedKeys) > 0;
    }
    if (isMonoKindPayload(decoded)) {
      return totalMonoSelectedRecords(decoded, importSelectedKeys) > 0;
    }
    return false;
  }, [decoded, importPreviewBuilding, importSelectedKeys]);

  function tryDecode(raw: string) {
    setDecodeError(null);
    setDecoded(null);
    const t = raw.trim();
    if (!t) {
      setDecodeError("Collez une chaîne ou chargez un fichier.");
      return;
    }
    try {
      let data: unknown;
      if (t.startsWith("v1:")) {
        data = importStringToPayload(t);
      } else {
        data = JSON.parse(t) as unknown;
      }
      setDecoded(data);
      if (isWorkspaceBundlePayload(data)) {
        toast.message("Paquet workspace détecté.");
      } else if (isMonoKindPayload(data)) {
        toast.message(`Paquet mono-type « ${data.kind} » détecté.`);
      } else {
        setDecodeError(
          "Format non reconnu : attendu un paquet workspace ou une chaîne v1: (export d’un seul type de données).",
        );
        setDecoded(null);
      }
    } catch (e) {
      setDecodeError(String(e));
    }
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      setImportText(text);
      tryDecode(text);
      toast.message(`Fichier « ${file.name} » chargé.`);
    } catch (err) {
      toast.error(String(err));
    }
  }

  async function runImport() {
    if (!decoded) return;
    try {
      if (isWorkspaceBundlePayload(decoded)) {
        const n = totalSelectedRecords(decoded, importSelectedKeys);
        if (n === 0) {
          toast.error("Cochez au moins une ligne à importer.");
          return;
        }
        const filtered = filterWorkspaceBundleBySelection(
          decoded,
          importSelectedKeys,
        );
        const { results, errors } = await importWorkspaceBundle(
          workspaceId,
          filtered,
          {
            skipKinds: new Set(),
            sourceType: "workspace",
            fileName: null,
          },
        );
        const total = results.reduce((a, r) => a + r.count, 0);
        const failed = results.reduce((a, r) => a + r.failed, 0);
        if (errors.length > 0) {
          toast.error(errors.join(" · "));
        } else {
          toast.success(
            `${total} ligne(s) importée(s)${failed ? `, ${failed} échec(s)` : ""}`,
          );
        }
        setImportText("");
        setDecoded(null);
        onRefresh();
        return;
      }
      if (isMonoKindPayload(decoded)) {
        const kind = decoded.kind;
        if (!kind) {
          toast.error("Paquet mono-type incomplet : type de données absent.");
          return;
        }
        const n = totalMonoSelectedRecords(decoded, importSelectedKeys);
        if (n === 0) {
          toast.error("Cochez au moins une ligne à importer.");
          return;
        }
        const filtered = filterMonoPayloadBySelection(
          decoded,
          kind,
          importSelectedKeys,
        );
        await importPayloadForWorkspace(workspaceId, filtered);
        toast.success("Import terminé.");
        setImportText("");
        setDecoded(null);
        onRefresh();
        return;
      }
    } catch (e) {
      toast.error(String(e));
    }
  }

  function onToggleImportRow(key: string, checked: boolean) {
    if (!decoded) return;
    setImportSelectedKeys((prev) =>
      applyImportSelectionToggle(decoded, key, checked, prev),
    );
  }

  function runBuildExport() {
    try {
      const payload = buildWorkspaceExportPayload({
        bundle,
        sidebarSelection,
        includeAllWhenNoSelection,
      });
      const keys = Object.keys(payload.modules);
      if (keys.length === 0) {
        toast.error(
          "Aucun module à exporter : cochez des lignes dans la barre latérale ou activez « Inclure tout pour les modules sans sélection ».",
        );
        return;
      }
      const s = exportPayloadToString(payload);
      setExportEncoded(s);
      toast.success("Chaîne v1: prête (copie ou téléchargement JSON possible).");
    } catch (e) {
      toast.error(String(e));
    }
  }

  function downloadJson() {
    try {
      const payload = buildWorkspaceExportPayload({
        bundle,
        sidebarSelection,
        includeAllWhenNoSelection,
      });
      if (Object.keys(payload.modules).length === 0) {
        toast.error("Rien à exporter.");
        return;
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `artisan-workspace-${workspaceName.slice(0, 24).replace(/\s+/g, "_")}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Fichier JSON téléchargé.");
    } catch (e) {
      toast.error(String(e));
    }
  }

  const sectionClass =
    "rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/30 p-3 space-y-3";

  return (
    <div className="min-h-0 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={panel === "import" ? "default" : "outline"}
          onClick={() => setPanel("import")}
        >
          Import
        </Button>
        <Button
          type="button"
          size="sm"
          variant={panel === "export" ? "default" : "outline"}
          onClick={() => setPanel("export")}
        >
          Export
        </Button>
      </div>

      {panel === "import" ? (
        <section className={sectionClass}>
          <h3 className="text-sm font-medium">Sources d’import</h3>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Même écran : choisissez le mode ci-dessous (pas de fenêtre séparée).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={importSource === "bundle" ? "default" : "outline"}
              onClick={() => setImportSource("bundle")}
            >
              Paquet workspace / v1:
            </Button>
            <Button
              type="button"
              size="sm"
              variant={importSource === "clientsCsv" ? "default" : "outline"}
              onClick={() => setImportSource("clientsCsv")}
            >
              Clients (CSV, Excel)
            </Button>
          </div>

          {importSource === "bundle" ? (
            <div className="flex flex-col gap-5 border-t border-[var(--color-border)] pt-4">
              <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                Fichier JSON (export workspace) ou chaîne <code>v1:</code> (workspace
                ou export d’un seul type de données). Après analyse : aperçu à droite (grand écran),
                cases par ligne ; seules les lignes cochées sont importées. Ordre
                d’import workspace : catégories → … → factures.
              </p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
                <div className="flex min-w-0 flex-col gap-3">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json,text/plain"
                      className="hidden"
                      onChange={(e) => void onImportFile(e)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className={dataManagerFileUploadButtonClassName}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Charger un fichier
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">Contenu (JSON ou v1:…)</Label>
                    <TextareaWithCopyButton
                      className="min-h-[120px] w-full bg-[var(--color-background)]"
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder='{"schemaVersion":2,"bundleKind":"invoicies.workspace", ...} ou v1:…'
                      copyButtonAriaLabel="Copier le contenu collé"
                      copyButtonTitle="Copier"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => tryDecode(importText)}
                    >
                      Analyser
                    </Button>
                    <Button
                      type="button"
                      disabled={!canImport}
                      onClick={() => void runImport()}
                    >
                      Importer
                    </Button>
                  </div>
                  {decodeError ? (
                    <p className="text-sm text-destructive">{decodeError}</p>
                  ) : null}
                </div>
                <DataManagerImportPreviewPane
                  sections={importPreviewSections}
                  selectedKeys={importSelectedKeys}
                  onToggleKey={onToggleImportRow}
                  onSelectAll={() =>
                    setImportSelectedKeys(
                      new Set(collectAllImportKeys(importPreviewSections)),
                    )
                  }
                  onDeselectAll={() => setImportSelectedKeys(new Set())}
                  building={importPreviewBuilding}
                  progressMessage={importPreviewProgress}
                  compact={compact}
                />
              </div>
            </div>
          ) : null}

          {importSource === "clientsCsv" ? (
            <div className="border-t border-[var(--color-border)] pt-3">
              <DataManagerClientsSection
                workspaceId={workspaceId}
                onRefresh={onRefresh}
                compact={compact}
              />
            </div>
          ) : null}
        </section>
      ) : (
        <>
          <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
            <section className={cn(sectionClass, "min-w-0")}>
              <h3 className="text-sm font-medium">Sélection (barre latérale)</h3>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 shrink-0"
                  checked={includeAllWhenNoSelection}
                  onChange={(e) => setIncludeAllWhenNoSelection(e.target.checked)}
                />
                <span>
                  Inclure <strong>tout</strong> le jeu pour chaque module où aucune
                  case n’est cochée (sinon seuls les modules avec au moins une case
                  participent à l’export).
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={exportSelectionView === "detailed" ? "default" : "outline"}
                  onClick={() => setExportSelectionView("detailed")}
                >
                  Vue détaillée
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={exportSelectionView === "summary" ? "default" : "outline"}
                  onClick={() => setExportSelectionView("summary")}
                >
                  Résumé
                </Button>
              </div>

              {exportSelectionView === "summary" ? (
                <ul className="space-y-1 text-xs text-[var(--color-muted-foreground)]">
                  {!anyEffectiveExportSelection ? (
                    <li>Aucune ligne ne partira dans l’export avec la configuration actuelle.</li>
                  ) : null}
                  {Array.from(effectiveIdsByKind.entries()).map(([kind, ids]) => (
                    <li key={kind}>
                      <span className="font-medium text-[var(--color-foreground)]">
                        {MODULE_LABELS[kind] ?? kind}
                      </span>
                      : {ids.size} ligne(s)
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)]/60 p-2">
                  <div
                    className={cn(
                      "space-y-3 overflow-y-auto pr-1",
                      compact ? "max-h-[min(18rem,44vh)]" : "max-h-[min(24rem,52vh)]",
                    )}
                  >
                    {!anyEffectiveExportSelection ? (
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        Aucune ligne ne partira dans l’export avec la configuration actuelle.
                      </p>
                    ) : null}

                    {(() => {
                      const selectedArticleIds = effectiveIdsByKind.get("articles") ?? new Set<string>();
                      const selectedCategoryIds = effectiveIdsByKind.get("categories") ?? new Set<string>();
                      const roots = visibleCategoryIds.byParent.get(null) ?? [];
                      if (
                        selectedArticleIds.size === 0 &&
                        selectedCategoryIds.size === 0 &&
                        !selectedArticlesByCategory.get(null)?.length
                      ) {
                        return null;
                      }
                      const renderCategoryNode = (categoryId: string, depth: number): React.ReactNode => {
                        if (!visibleCategoryIds.ids.has(categoryId)) return null;
                        const cat = visibleCategoryIds.byId.get(categoryId);
                        if (!cat) return null;
                        const childIds = visibleCategoryIds.byParent.get(categoryId) ?? [];
                        const articles = selectedArticlesByCategory.get(categoryId) ?? [];
                        return (
                          <li key={categoryId} className="space-y-1">
                            <div
                              className="flex items-start gap-2 text-xs"
                              style={{ paddingLeft: `${depth * 0.9}rem` }}
                            >
                              <span className="text-[var(--color-muted-foreground)]">▸</span>
                              <span className="font-medium text-[var(--color-foreground)]">
                                {cat.name}
                              </span>
                              {selectedCategoryIds.has(categoryId) ? (
                                <span className="rounded bg-[var(--color-muted)] px-1 py-0.5 text-[10px] text-[var(--color-muted-foreground)]">
                                  sélectionnée
                                </span>
                              ) : null}
                            </div>
                            {articles.length > 0 ? (
                              <ul className="space-y-1">
                                {articles.map((a) => (
                                  <li
                                    key={a.id}
                                    className="text-xs text-[var(--color-foreground)]"
                                    style={{ paddingLeft: `${(depth + 1) * 0.9}rem` }}
                                  >
                                    • {a.name}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            {childIds.length > 0 ? (
                              <ul className="space-y-1">
                                {childIds.map((childId) => renderCategoryNode(childId, depth + 1))}
                              </ul>
                            ) : null}
                          </li>
                        );
                      };
                      return (
                        <section className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                            Catalogue
                          </p>
                          <ul className="space-y-1">{roots.map((rootId) => renderCategoryNode(rootId, 0))}</ul>
                          {(selectedArticlesByCategory.get(null) ?? []).length > 0 ? (
                            <div className="pt-1">
                              <p className="text-xs font-medium text-[var(--color-foreground)]">
                                Sans catégorie
                              </p>
                              <ul className="space-y-1 pt-1">
                                {(selectedArticlesByCategory.get(null) ?? []).map((a) => (
                                  <li key={a.id} className="text-xs text-[var(--color-foreground)]">
                                    • {a.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </section>
                      );
                    })()}

                    {(
                      [
                        "tax-rates",
                        "discount-presets",
                        "snippets",
                        "clients",
                        "projects",
                        "quotes",
                        "invoices",
                      ] as const
                    ).map((kind) => {
                      const ids = effectiveIdsByKind.get(kind) ?? new Set<string>();
                      if (ids.size === 0) return null;
                      const labels = labelsByKind[kind];
                      const lines = Array.from(ids)
                        .map((id) => labels.get(id) ?? id)
                        .sort((a, b) => a.localeCompare(b, "fr"));
                      return (
                        <section key={kind} className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                            {MODULE_LABELS[kind] ?? kind}
                          </p>
                          <ul className="space-y-1">
                            {lines.map((line, index) => (
                              <li key={`${kind}-${index}-${line}`} className="text-xs text-[var(--color-foreground)]">
                                • {line}
                              </li>
                            ))}
                          </ul>
                        </section>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
            <section className={cn(sectionClass, "min-w-0")}>
              <h3 className="text-sm font-medium">Générer l’export workspace</h3>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={runBuildExport}>
                  Préparer la chaîne v1:
                </Button>
                <Button type="button" variant="secondary" onClick={downloadJson}>
                  Télécharger JSON
                </Button>
              </div>
              <Label className="text-xs">Chaîne v1: (workspace)</Label>
              <TextareaWithCopyButton
                readOnly
                className="min-h-[100px] w-full bg-[var(--color-muted)]/30"
                value={exportEncoded}
                placeholder="Préparez l’export pour remplir cette zone."
                emptyCopyMessage="Générez d’abord l’export."
                successCopyMessage="Chaîne copiée."
                copyButtonAriaLabel="Copier la chaîne v1:"
                copyButtonTitle="Copier la chaîne"
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
