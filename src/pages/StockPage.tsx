import * as React from "react";
import { useLocation } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { DocumentModulePageGate } from "@/components/DocumentModulePageGate";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { IconToolButton } from "@/components/IconToolButton";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as api from "@/lib/api";
import { MARKETPLACE_ROUTE_STOCK_MANAGER } from "@/lib/marketplaceModules";
import {
  formatStockLevelsUpdatedAt,
  mergeCatalogStockRows,
} from "@/lib/stockCatalog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StockPageDialogs } from "@/pages/StockPageDialogs";
import {
  articleToUpdateInput,
  movementKindLabel,
  normSupplierField,
} from "@/pages/stockPageHelpers";

export function StockPage() {
  const location = useLocation();
  const isHomeStock = location.pathname.startsWith("/home/stock");
  const { active } = useWorkspace();
  const { loading: modulesLoading, stockManagerEnabled } =
    useDocumentModules();
  const [levels, setLevels] = React.useState<api.StockLevelRow[]>([]);
  const [articleSettings, setArticleSettings] = React.useState<
    api.StockArticleSettingRow[]
  >([]);
  const [movements, setMovements] = React.useState<api.StockMovementRow[]>([]);
  const [articles, setArticles] = React.useState<api.Article[]>([]);
  const [categories, setCategories] = React.useState<api.Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [selectedArticleId, setSelectedArticleId] = React.useState<string | null>(
    null,
  );

  const [articleId, setArticleId] = React.useState("");
  const [kind, setKind] = React.useState<"in" | "out" | "adjustment">("in");
  const [qty, setQty] = React.useState("");
  const [movLabel, setMovLabel] = React.useState("");

  const [addOpen, setAddOpen] = React.useState(false);
  const [addArticleId, setAddArticleId] = React.useState("");
  const [addQty, setAddQty] = React.useState("");
  const [addNote, setAddNote] = React.useState("");
  const [addSupplierName, setAddSupplierName] = React.useState("");
  const [addSupplierReference, setAddSupplierReference] = React.useState("");

  const [editOpen, setEditOpen] = React.useState(false);
  const [editTargetQty, setEditTargetQty] = React.useState("");
  const [editNote, setEditNote] = React.useState("");
  const [editSupplierName, setEditSupplierName] = React.useState("");
  const [editSupplierReference, setEditSupplierReference] = React.useState("");
  const [editTrackStock, setEditTrackStock] = React.useState(false);
  const [editMinQty, setEditMinQty] = React.useState("");

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const [lv, mv, art, cats] = await Promise.all([
        api.listStockLevels(active.id),
        api.listStockMovements(active.id),
        api.listArticles(active.id),
        api.listCategories(active.id),
      ]);
      setLevels(lv);
      setMovements(mv);
      setArticles(art);
      setCategories(cats);
      setArticleSettings(await api.listStockArticleSettings(active.id));
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }, [active]);

  React.useEffect(() => {
    if (!stockManagerEnabled || !active) return;
    void load();
  }, [load, stockManagerEnabled, active]);

  const catalogRows = React.useMemo(
    () => mergeCatalogStockRows(articles, categories, levels),
    [articles, categories, levels],
  );

  const settingsByArticleId = React.useMemo(() => {
    const m = new Map<string, api.StockArticleSettingRow>();
    for (const s of articleSettings) {
      m.set(s.articleId, s);
    }
    return m;
  }, [articleSettings]);

  const selectedRow = React.useMemo(
    () => catalogRows.find((r) => r.articleId === selectedArticleId) ?? null,
    [catalogRows, selectedArticleId],
  );

  function isBelowMin(
    row: (typeof catalogRows)[number],
  ): boolean {
    const s = settingsByArticleId.get(row.articleId);
    if (!s?.trackStock || s.minQuantity == null) return false;
    return row.quantity < s.minQuantity;
  }

  const articleOptions = articles.map((a) => ({
    value: a.id,
    label: a.name,
  }));

  React.useEffect(() => {
    if (!addOpen) return;
    const a = articles.find((x) => x.id === addArticleId.trim());
    if (a) {
      setAddSupplierName(a.supplierName?.trim() ?? "");
      setAddSupplierReference(a.supplierReference?.trim() ?? "");
    } else {
      setAddSupplierName("");
      setAddSupplierReference("");
    }
  }, [addOpen, addArticleId, articles]);

  async function submitMovement() {
    if (!active) return;
    const q = Number.parseFloat(qty.replace(",", "."));
    if (!Number.isFinite(q)) {
      toast.error("Indiquez une quantité numérique.");
      return;
    }
    if (!articleId.trim()) {
      toast.error("Choisissez un article.");
      return;
    }
    setBusy(true);
    try {
      await api.createStockMovement(active.id, {
        articleId: articleId.trim(),
        movementKind: kind,
        quantity: q,
        label: movLabel.trim() || null,
      });
      toast.success("Mouvement enregistré");
      setQty("");
      setMovLabel("");
      await load();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function submitAddStock() {
    if (!active) return;
    const q = Number.parseFloat(addQty.replace(",", "."));
    if (!Number.isFinite(q) || q <= 0) {
      toast.error("Indiquez une quantité positive.");
      return;
    }
    if (!addArticleId.trim()) {
      toast.error("Choisissez un article du catalogue.");
      return;
    }
    setBusy(true);
    try {
      await api.createStockMovement(active.id, {
        articleId: addArticleId.trim(),
        movementKind: "in",
        quantity: q,
        label: addNote.trim() || "Saisie stock",
      });
      const art = articles.find((x) => x.id === addArticleId.trim());
      const nextSn = normSupplierField(addSupplierName);
      const nextSr = normSupplierField(addSupplierReference);
      if (
        art &&
        (normSupplierField(art.supplierName) !== nextSn ||
          normSupplierField(art.supplierReference) !== nextSr)
      ) {
        await api.updateArticle(
          art.id,
          articleToUpdateInput(art, {
            supplierName: nextSn,
            supplierReference: nextSr,
          }),
        );
      }
      toast.success("Stock mis à jour");
      setAddOpen(false);
      setAddArticleId("");
      setAddQty("");
      setAddNote("");
      setAddSupplierName("");
      setAddSupplierReference("");
      await load();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  function openEditModal() {
    if (!selectedRow) return;
    setEditTargetQty(String(selectedRow.quantity));
    setEditNote("");
    setEditSupplierName(selectedRow.supplierName || "");
    setEditSupplierReference(selectedRow.supplierReference || "");
    const s = settingsByArticleId.get(selectedRow.articleId);
    setEditTrackStock(s?.trackStock ?? false);
    setEditMinQty(
      s?.minQuantity != null ? String(s.minQuantity) : "",
    );
    setEditOpen(true);
  }

  async function submitEditStock() {
    if (!active || !selectedRow) return;
    const target = Number.parseFloat(editTargetQty.replace(",", "."));
    if (!Number.isFinite(target) || target < 0) {
      toast.error("Indiquez une quantité en stock valide (≥ 0).");
      return;
    }
    const art = articles.find((x) => x.id === selectedRow.articleId);
    const nextSn = normSupplierField(editSupplierName);
    const nextSr = normSupplierField(editSupplierReference);
    const supplierChanged =
      !!art &&
      (normSupplierField(art.supplierName) !== nextSn ||
        normSupplierField(art.supplierReference) !== nextSr);
    const delta = target - selectedRow.quantity;
    const qtyChanged = Math.abs(delta) >= 1e-9;

    let settingsChanged = false;
    {
      const prev = settingsByArticleId.get(selectedRow.articleId);
      const minParsed =
        editMinQty.trim() === ""
          ? null
          : Number.parseFloat(editMinQty.replace(",", "."));
      if (editTrackStock && minParsed != null && !Number.isFinite(minParsed)) {
        toast.error("Indiquez un seuil minimum valide.");
        return;
      }
      if (
        editTrackStock &&
        minParsed != null &&
        (minParsed < 0 || !Number.isFinite(minParsed))
      ) {
        toast.error("Le seuil minimum doit être ≥ 0.");
        return;
      }
      settingsChanged =
        (prev?.trackStock ?? false) !== editTrackStock ||
        (prev?.minQuantity ?? null) !==
          (editTrackStock ? minParsed : null);
    }

    if (!qtyChanged && !supplierChanged && !settingsChanged) {
      toast.info("Aucun changement.");
      setEditOpen(false);
      return;
    }
    setBusy(true);
    try {
      if (qtyChanged) {
        await api.createStockMovement(active.id, {
          articleId: selectedRow.articleId,
          movementKind: "adjustment",
          quantity: delta,
          label: editNote.trim() || "Ajustement inventaire",
        });
      }
      if (supplierChanged && art) {
        await api.updateArticle(
          art.id,
          articleToUpdateInput(art, {
            supplierName: nextSn,
            supplierReference: nextSr,
          }),
        );
      }
      if (settingsChanged) {
        const minParsed =
          editMinQty.trim() === ""
            ? null
            : Number.parseFloat(editMinQty.replace(",", "."));
        await api.upsertStockArticleSetting(active.id, {
          articleId: selectedRow.articleId,
          trackStock: editTrackStock,
          minQuantity: editTrackStock ? minParsed : null,
          reorderQuantity: null,
        });
      }
      toast.success("Modifications enregistrées");
      setEditOpen(false);
      await load();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function confirmClearStock() {
    if (!active || !selectedRow) return;
    setBusy(true);
    try {
      await api.clearArticleStock(active.id, selectedRow.articleId);
      toast.success("Données de stock effacées pour cet article");
      setDeleteOpen(false);
      setSelectedArticleId(null);
      await load();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DocumentModulePageGate
      enabled={stockManagerEnabled}
      loading={modulesLoading}
      redirectToast="Activez le module Stock Manager dans la Marketplace (Stock)."
      redirectTo={MARKETPLACE_ROUTE_STOCK_MANAGER}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <PageTitleWithInfo
              description={
                <>
                  Catalogue (comme Produits) et quantités. Les icônes à droite :
                  ajout d’entrée, modification (stock + fournisseur / référence),
                  effacement de la surcouche stock uniquement.
                  {!isHomeStock
                    ? " En dessous : mouvements détaillés (entrée, sortie, ajustement)."
                    : ""}
                </>
              }
            >
              <h1 className="text-lg font-semibold">Stock</h1>
            </PageTitleWithInfo>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <IconToolButton
              label="Ajouter du stock (catalogue)"
              onClick={() => {
                setAddArticleId(selectedArticleId ?? "");
                setAddQty("");
                setAddNote("");
                setAddOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </IconToolButton>
            <IconToolButton
              label="Modifier stock ou fournisseur"
              disabled={!selectedRow}
              onClick={() => void openEditModal()}
            >
              <Pencil className="h-4 w-4" />
            </IconToolButton>
            <IconToolButton
              label="Effacer le stock (conserve l’article dans le catalogue)"
              disabled={!selectedRow?.hasStockData}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </IconToolButton>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Chargement…
            </p>
          ) : (
            <div className="mx-auto flex max-w-5xl flex-col gap-8">
              <section>
                <h2 className="mb-2 text-sm font-medium">
                  Articles et quantités
                </h2>
                {catalogRows.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Aucun article dans le catalogue. Ajoutez des produits dans
                    Bases de données → Produits.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/20 text-left">
                          <th className="px-3 py-2 font-medium">Catégorie</th>
                          <th className="px-3 py-2 font-medium">Article</th>
                          <th className="px-3 py-2 font-medium">Fournisseur</th>
                          <th className="px-3 py-2 font-medium">Référence</th>
                          <th className="px-3 py-2 font-medium">En stock</th>
                          <th className="px-3 py-2 font-medium">Suivi</th>
                          <th className="px-3 py-2 font-medium">Seuil min.</th>
                          <th className="px-3 py-2 font-medium">Dernière maj.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalogRows.map((r) => (
                          <tr
                            key={r.articleId}
                            role="button"
                            tabIndex={0}
                            className={cn(
                              "cursor-pointer border-b border-[var(--color-border)] last:border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-ring)]",
                              selectedArticleId === r.articleId &&
                                "bg-[var(--color-muted)]/40",
                              isBelowMin(r) &&
                                "bg-orange-500/10 dark:bg-orange-500/15",
                            )}
                            onClick={() => setSelectedArticleId(r.articleId)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedArticleId(r.articleId);
                              }
                            }}
                          >
                            <td className="max-w-[12rem] truncate px-3 py-2 text-[var(--color-muted-foreground)]">
                              {r.categoryPath}
                            </td>
                            <td className="px-3 py-2 font-medium">
                              {r.articleName}
                            </td>
                            <td className="max-w-[10rem] truncate px-3 py-2 text-[var(--color-muted-foreground)]">
                              {r.supplierName || "—"}
                            </td>
                            <td className="max-w-[10rem] truncate px-3 py-2 font-mono text-xs text-[var(--color-muted-foreground)]">
                              {r.supplierReference || "—"}
                            </td>
                            <td className="px-3 py-2 tabular-nums">{r.quantity}</td>
                            <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                              {settingsByArticleId.get(r.articleId)?.trackStock
                                ? "Oui"
                                : "—"}
                            </td>
                            <td className="px-3 py-2 tabular-nums text-[var(--color-muted-foreground)]">
                              {settingsByArticleId.get(r.articleId)
                                ?.minQuantity != null
                                ? settingsByArticleId.get(r.articleId)!
                                    .minQuantity
                                : "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-[var(--color-muted-foreground)]">
                              {formatStockLevelsUpdatedAt(r.updatedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {!isHomeStock ? (
                <>
                  <section>
                    <h2 className="mb-2 text-sm font-medium">Nouveau mouvement</h2>
                    <div className="grid gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-4 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="stock-art">Article</Label>
                        <SearchableCombobox
                          id="stock-art"
                          label="Article"
                          hideLabel
                          value={articleId}
                          onValueChange={setArticleId}
                          options={articleOptions}
                          placeholder="Choisir un article…"
                          allowClearSelection
                          triggerClassName="w-full"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="stock-kind">Type</Label>
                        <select
                          id="stock-kind"
                          className="flex h-9 w-full rounded-md border border-[var(--color-input)] bg-transparent px-2 text-sm"
                          value={kind}
                          onChange={(e) =>
                            setKind(
                              e.target.value as "in" | "out" | "adjustment",
                            )
                          }
                        >
                          <option value="in">Entrée</option>
                          <option value="out">Sortie</option>
                          <option value="adjustment">Ajustement (relatif)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="stock-qty">Quantité</Label>
                        <Input
                          id="stock-qty"
                          inputMode="decimal"
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                          placeholder={
                            kind === "adjustment"
                              ? "Positif ou négatif"
                              : "Quantité positive"
                          }
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="stock-lab">Motif (optionnel)</Label>
                        <Input
                          id="stock-lab"
                          value={movLabel}
                          onChange={(e) => setMovLabel(e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => void submitMovement()}
                        >
                          Enregistrer le mouvement
                        </Button>
                      </div>
                    </div>
                  </section>
                  <section>
                    <h2 className="mb-2 text-sm font-medium">Mouvements récents</h2>
                    {movements.length === 0 ? (
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        Aucun mouvement pour cet espace.
                      </p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {movements.map((m) => (
                          <li
                            key={m.id}
                            className="rounded border border-[var(--color-border)] px-3 py-2"
                          >
                            <span className="font-medium">
                              {movementKindLabel(m.movementKind)}
                            </span>
                            <span className="text-[var(--color-muted-foreground)]">
                              {" "}
                              — {m.articleName} —{" "}
                            </span>
                            <span className="tabular-nums">
                              {m.quantityDelta > 0 ? "+" : ""}
                              {m.quantityDelta}
                            </span>
                            {m.label?.trim() ? (
                              <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                                {m.label.trim()}
                              </p>
                            ) : null}
                            <p className="mt-0.5 text-[10px] text-[var(--color-muted-foreground)]">
                              {m.createdAt}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <StockPageDialogs
        addOpen={addOpen}
        setAddOpen={setAddOpen}
        addArticleId={addArticleId}
        setAddArticleId={setAddArticleId}
        articleOptions={articleOptions}
        addQty={addQty}
        setAddQty={setAddQty}
        addSupplierName={addSupplierName}
        setAddSupplierName={setAddSupplierName}
        addSupplierReference={addSupplierReference}
        setAddSupplierReference={setAddSupplierReference}
        addNote={addNote}
        setAddNote={setAddNote}
        busy={busy}
        onSubmitAdd={() => void submitAddStock()}
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        selectedRow={selectedRow}
        editTargetQty={editTargetQty}
        setEditTargetQty={setEditTargetQty}
        editSupplierName={editSupplierName}
        setEditSupplierName={setEditSupplierName}
        editSupplierReference={editSupplierReference}
        setEditSupplierReference={setEditSupplierReference}
        editNote={editNote}
        setEditNote={setEditNote}
        editTrackStock={editTrackStock}
        setEditTrackStock={setEditTrackStock}
        editMinQty={editMinQty}
        setEditMinQty={setEditMinQty}
        onSubmitEdit={() => void submitEditStock()}
        deleteOpen={deleteOpen}
        setDeleteOpen={setDeleteOpen}
        onConfirmClear={() => void confirmClearStock()}
      />
    </DocumentModulePageGate>
  );
}
