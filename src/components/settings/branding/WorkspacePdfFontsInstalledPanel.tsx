import * as React from "react";
import type { Workspace } from "@/lib/api";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, ChevronRight, Folder, Pencil, Trash2, X } from "lucide-react";
import { FontLibraryRow } from "@/components/settings/branding/WorkspacePdfFontLibraryRow";
import { WorkspacePdfFontMovePopover } from "@/components/settings/branding/WorkspacePdfFontMovePopover";
import {
  applyMovedFontsInBranding,
  applyRenamedFontFolderInBranding,
  upsertImportedWorkspaceFont,
  removeWorkspaceFontsFromState,
} from "@/lib/brandingWorkspaceFonts";
import {
  folderLabelForKey,
  groupImportedFontsByFolder,
  sortFolderKeys,
} from "@/lib/brandingWorkspaceFontGroups";
import { cn, warningNoticeTextClassName } from "@/lib/utils";
import type {
  BrandingImportedWorkspaceFont,
  BrandingPdfFont,
  BrandingState,
} from "@/lib/documentOptions";
import { formatFontImportError } from "@/lib/pdfFontImportError";
import { resolvePdfExportBodyFontFamily } from "@/lib/pdfFontResolve";

export type WorkspacePdfFontsInstalledPanelProps = {
  workspace: Workspace;
  branding: BrandingState;
  setBranding: React.Dispatch<React.SetStateAction<BrandingState>>;
  fontImportError: string | null;
  setFontImportError: (value: string | null) => void;
  fontImportBusy: boolean;
  setFontImportBusy: (value: boolean) => void;
  ttcFaceIndex: number;
  setTtcFaceIndex: React.Dispatch<React.SetStateAction<number>>;
};

export function WorkspacePdfFontsInstalledPanel({
  workspace,
  branding,
  setBranding,
  fontImportError,
  setFontImportError,
  fontImportBusy,
  setFontImportBusy,
  ttcFaceIndex,
  setTtcFaceIndex,
}: WorkspacePdfFontsInstalledPanelProps) {
  const [selectedFontRelPaths, setSelectedFontRelPaths] = React.useState<
    string[]
  >([]);
  const [fontLibraryBusy, setFontLibraryBusy] = React.useState(false);
  const libraryHeaderCheckboxRef = React.useRef<HTMLInputElement>(null);
  const [openFontFolders, setOpenFontFolders] = React.useState<
    Record<string, boolean>
  >({});
  const [folderRenameKey, setFolderRenameKey] = React.useState<string | null>(
    null,
  );
  const [folderRenameDraft, setFolderRenameDraft] = React.useState("");
  const [fontFolderRenameBusy, setFontFolderRenameBusy] = React.useState(false);
  const [movePopoverOpen, setMovePopoverOpen] = React.useState(false);
  const [moveCustomFolder, setMoveCustomFolder] = React.useState("");

  const fontGroups = React.useMemo(() => {
    const map = groupImportedFontsByFolder(
      branding.importedWorkspaceFonts,
      workspace.id,
    );
    return sortFolderKeys([...map.keys()]).map((key) => ({
      key,
      fonts: map.get(key) ?? [],
    }));
  }, [branding.importedWorkspaceFonts, workspace.id]);

  const libraryUsesFolderHeaders =
    fontGroups.length > 1 ||
    (fontGroups.length === 1 && fontGroups[0].key !== "");

  const libraryPathsKey = branding.importedWorkspaceFonts
    .map((e) => e.relativePath)
    .join("\0");

  React.useEffect(() => {
    const valid = new Set(
      branding.importedWorkspaceFonts.map((e) => e.relativePath),
    );
    setSelectedFontRelPaths((prev) => prev.filter((p) => valid.has(p)));
  }, [libraryPathsKey]);

  const allLibrarySelected =
    branding.importedWorkspaceFonts.length > 0 &&
    selectedFontRelPaths.length === branding.importedWorkspaceFonts.length;

  React.useEffect(() => {
    const el = libraryHeaderCheckboxRef.current;
    if (!el) return;
    const n = branding.importedWorkspaceFonts.length;
    const s = selectedFontRelPaths.length;
    el.indeterminate = s > 0 && s < n;
  }, [branding.importedWorkspaceFonts.length, selectedFontRelPaths.length]);

  async function removeWorkspaceFontsFromDiskAndState(paths: string[]) {
    const unique = [...new Set(paths.map((p) => p.trim()).filter(Boolean))];
    if (unique.length === 0) return;
    setFontLibraryBusy(true);
    try {
      await api.deleteWorkspacePdfFonts(workspace.id, unique);
      setFontImportError(null);
      setBranding((b) => removeWorkspaceFontsFromState(b, unique));
      setSelectedFontRelPaths((prev) => prev.filter((p) => !unique.includes(p)));
      toast.success(
        unique.length === 1
          ? "Police supprimée (fichier et bibliothèque)"
          : `${unique.length} polices supprimées (fichiers et bibliothèque)`,
      );
    } catch (e) {
      toast.error(formatFontImportError(e));
    } finally {
      setFontLibraryBusy(false);
    }
  }

  async function confirmFolderRename() {
    if (folderRenameKey == null) return;
    const from = folderRenameKey;
    const toRaw = folderRenameDraft.trim();
    if (!toRaw) {
      toast.error("Indiquez un nom de dossier.");
      return;
    }
    if (toRaw === from) {
      setFolderRenameKey(null);
      return;
    }
    setFontFolderRenameBusy(true);
    try {
      const r = await api.renameWorkspacePdfFontFolder(
        workspace.id,
        from,
        toRaw,
      );
      const oldP = `workspace_assets/${workspace.id}/fonts/${r.fromKey}/`;
      const newP = `workspace_assets/${workspace.id}/fonts/${r.toKey}/`;
      setBranding((b) =>
        applyRenamedFontFolderInBranding(b, workspace.id, r.fromKey, r.toKey),
      );
      setSelectedFontRelPaths((prev) =>
        prev.map((p) =>
          p.startsWith(oldP) ? newP + p.slice(oldP.length) : p,
        ),
      );
      setOpenFontFolders((o) => {
        const next = { ...o };
        delete next[from];
        next[r.toKey] = o[from] !== false;
        return next;
      });
      setFolderRenameKey(null);
      toast.success(
        "Dossier renommé sur le disque. Enregistrez le branding pour mettre à jour le profil.",
      );
    } catch (e) {
      toast.error(formatFontImportError(e));
    } finally {
      setFontFolderRenameBusy(false);
    }
  }

  function cancelFolderRename() {
    setFolderRenameKey(null);
  }

  async function moveSelectionToFolder(targetFolderKey: string) {
    const paths = [...selectedFontRelPaths];
    if (paths.length === 0) return;
    setFontLibraryBusy(true);
    setMovePopoverOpen(false);
    try {
      const rows = await api.moveWorkspacePdfFontsToFolder(
        workspace.id,
        paths,
        targetFolderKey,
      );
      setBranding((b) => applyMovedFontsInBranding(b, rows));
      setSelectedFontRelPaths((prev) =>
        prev.map((p) => {
          const r = rows.find((x) => x.oldRelativePath === p);
          return r ? r.newRelativePath : p;
        }),
      );
      const destKey = targetFolderKey.trim();
      setOpenFontFolders((o) => ({ ...o, [destKey]: true }));
      setMoveCustomFolder("");
      toast.success(
        rows.length === 1
          ? "Police déplacée. Enregistrez le branding pour mettre à jour le profil."
          : `${rows.length} polices déplacées. Enregistrez le branding pour mettre à jour le profil.`,
      );
    } catch (e) {
      toast.error(formatFontImportError(e));
    } finally {
      setFontLibraryBusy(false);
    }
  }

  const sortedDestinationFolderKeys = React.useMemo(
    () => sortFolderKeys([...new Set(fontGroups.map((g) => g.key))]),
    [fontGroups],
  );

  return (
    <>
      {branding.pdfFont.kind === "system" ? (
        <p className={cn(warningNoticeTextClassName, "text-xs")}>
          Ancienne configuration (chemin système). Utilisez{" "}
          <strong>Importer une police…</strong> pour copier un fichier dans
          l&apos;espace, puis enregistrez le branding.
        </p>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1 space-y-3 lg:max-w-xl">
          {branding.importedWorkspaceFonts.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="workspace-font-library">
                Police active pour le PDF
              </Label>
              <select
                id="workspace-font-library"
                className="flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm focus:outline-none"
                value={
                  branding.pdfFont.kind === "workspace"
                    ? branding.pdfFont.relativePath
                    : ""
                }
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setBranding((b) => {
                    if (!v) {
                      return {
                        ...b,
                        pdfFont: {
                          kind: "builtin",
                          builtinId: "helvetica",
                        },
                      };
                    }
                    const entry = b.importedWorkspaceFonts.find(
                      (x) => x.relativePath === v,
                    );
                    if (!entry) return b;
                    return {
                      ...b,
                      pdfFont: {
                        kind: "workspace",
                        relativePath: entry.relativePath,
                        displayFamily: entry.label,
                      },
                    };
                  });
                }}
              >
                <option value="">
                  — Utiliser une police intégrée pour le PDF —
                </option>
                {branding.importedWorkspaceFonts.map((f) => (
                  <option key={f.relativePath} value={f.relativePath}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {branding.pdfFont.kind === "workspace" &&
          branding.importedWorkspaceFonts.length === 0 ? (
            <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-3 py-2 text-sm">
              <p className="font-medium text-[var(--color-foreground)]">
                {branding.pdfFont.displayFamily}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Non listée dans le tableau à droite — enregistrez le branding
                pour l&apos;ajouter à la bibliothèque.
              </p>
            </div>
          ) : null}

          {fontImportError ? (
            <div
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
              role="alert"
            >
              <p className="font-medium">Import ou validation PDF</p>
              <p className="mt-1 whitespace-pre-wrap break-words">
                {fontImportError}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 h-8 px-2 text-red-900 dark:text-red-100"
                onClick={() => setFontImportError(null)}
              >
                Fermer
              </Button>
            </div>
          ) : null}

          <div className="flex max-w-md flex-col gap-2">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[6rem] flex-1">
                <Label htmlFor="ttc-face">Face (.ttc)</Label>
                <Input
                  id="ttc-face"
                  type="number"
                  min={0}
                  max={255}
                  className="mt-1"
                  value={Number.isFinite(ttcFaceIndex) ? ttcFaceIndex : 0}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setTtcFaceIndex(
                      Number.isFinite(n)
                        ? Math.min(255, Math.max(0, n))
                        : 0,
                    );
                  }}
                />
              </div>
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Pour un fichier <strong>.ttc</strong>, choisissez l&apos;index de
              la face (0 = première). Pour <strong>.ttf</strong> /{" "}
              <strong>.otf</strong>, laissez 0.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit shrink-0"
                  disabled={fontImportBusy || fontLibraryBusy}
                  onClick={async () => {
                    setFontImportError(null);
                    const src = await api.pickPdfFontFilePath();
                    if (!src) {
                      toast.message("Aucun fichier choisi");
                      return;
                    }
                    setFontImportBusy(true);
                    try {
                      const rel = await api.importWorkspacePdfFontFromPath(
                        workspace.id,
                        src,
                        ttcFaceIndex,
                      );
                      const base = src
                        .replace(/^.*[/\\]/, "")
                        .replace(/\.[^.]+$/, "");
                      const tempFont: BrandingPdfFont = {
                        kind: "workspace",
                        relativePath: rel,
                        displayFamily: base || "Police importée",
                      };
                      try {
                        await resolvePdfExportBodyFontFamily(
                          tempFont,
                          workspace.id,
                        );
                      } catch (ve) {
                        const msg = formatFontImportError(ve);
                        setFontImportError(
                          `${msg}\n\nLe fichier a été copié dans l’espace mais ne peut pas être utilisé pour le PDF. Choisissez une autre police ou un autre fichier.`,
                        );
                        toast.error(
                          "Cette police n’est pas utilisable pour le PDF.",
                        );
                        return;
                      }
                      setBranding((b) => ({
                        ...b,
                        pdfFont: tempFont,
                        importedWorkspaceFonts: upsertImportedWorkspaceFont(
                          b.importedWorkspaceFonts,
                          {
                            relativePath: tempFont.relativePath,
                            label: tempFont.displayFamily,
                          },
                        ),
                      }));
                      toast.success(
                        "Police importée, enregistrée dans la bibliothèque",
                      );
                    } catch (e) {
                      const msg = formatFontImportError(e);
                      setFontImportError(msg);
                      toast.error(msg);
                    } finally {
                      setFontImportBusy(false);
                    }
                  }}
                >
                  Importer une police…
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit shrink-0"
                  disabled={fontImportBusy || fontLibraryBusy}
                  onClick={async () => {
                    setFontImportError(null);
                    const folder = await api.pickPdfFontFolderPath();
                    if (!folder) {
                      toast.message("Aucun dossier choisi");
                      return;
                    }
                    setFontImportBusy(true);
                    try {
                      const rows = await api.importWorkspacePdfFontsFromFolder(
                        workspace.id,
                        folder,
                      );
                      if (rows.length === 0) {
                        toast.message(
                          "Aucun fichier .ttf, .otf ou .ttc importable dans ce dossier (récursif, profondeur max. 8).",
                        );
                        return;
                      }
                      const additions: BrandingImportedWorkspaceFont[] = [];
                      const invalidLabels: string[] = [];
                      let firstOk: BrandingPdfFont | null = null;
                      for (const row of rows) {
                        const tempFont: BrandingPdfFont = {
                          kind: "workspace",
                          relativePath: row.relativePath,
                          displayFamily: row.label,
                        };
                        try {
                          await resolvePdfExportBodyFontFamily(
                            tempFont,
                            workspace.id,
                          );
                          additions.push({
                            relativePath: row.relativePath,
                            label: row.label,
                          });
                          if (!firstOk) firstOk = tempFont;
                        } catch {
                          invalidLabels.push(row.label);
                        }
                      }
                      setBranding((b) => {
                        let nextList = [...b.importedWorkspaceFonts];
                        for (const a of additions) {
                          nextList = upsertImportedWorkspaceFont(nextList, a);
                        }
                        let pdfFont = b.pdfFont;
                        if (firstOk) {
                          const activePath =
                            pdfFont.kind === "workspace"
                              ? pdfFont.relativePath
                              : "";
                          const stillInList =
                            Boolean(activePath) &&
                            nextList.some(
                              (e) => e.relativePath === activePath,
                            );
                          if (
                            pdfFont.kind !== "workspace" ||
                            !stillInList
                          ) {
                            pdfFont = firstOk;
                          }
                        }
                        return {
                          ...b,
                          importedWorkspaceFonts: nextList,
                          pdfFont,
                        };
                      });
                      if (additions.length > 0) {
                        toast.success(
                          invalidLabels.length === 0
                            ? `${additions.length} police(s) ajoutée(s) à la bibliothèque`
                            : `${additions.length} police(s) validée(s), ${invalidLabels.length} ignorée(s) (inutilisables pour le PDF)`,
                        );
                      } else {
                        toast.error(
                          "Aucune police du dossier n’a pu être validée pour le PDF.",
                        );
                        if (invalidLabels.length > 0) {
                          setFontImportError(
                            `Polices copiées mais non utilisables pour le PDF : ${invalidLabels.join(", ")}`,
                          );
                        }
                      }
                    } catch (e) {
                      const msg = formatFontImportError(e);
                      setFontImportError(msg);
                      toast.error(msg);
                    } finally {
                      setFontImportBusy(false);
                    }
                  }}
                >
                  Importer un dossier…
                </Button>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Dossier : parcours <strong>récursif</strong> des{" "}
                <strong>.ttf</strong> / <strong>.otf</strong> /{" "}
                <strong>.ttc</strong>, structure des sous-dossiers conservée (noms
                sanitisés, profondeur max. 8, max. 80 fichiers, face 0 pour les{" "}
                <strong>.ttc</strong>). Chaque fichier est validé pour le moteur
                PDF.
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
            Bibliothèque de polices
          </h3>
          {branding.importedWorkspaceFonts.length === 0 ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Aucune police enregistrée. Importez un fichier ou un dossier dans
              la colonne de gauche.
            </p>
          ) : (
            <>
              <div className="flex flex-col overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
                <div
                  className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2 border-b border-[var(--color-border)] px-2 py-1.5"
                  role="row"
                >
                  <div className="flex w-8 shrink-0 justify-center">
                    <input
                      ref={libraryHeaderCheckboxRef}
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-[var(--color-input)]"
                      checked={allLibrarySelected}
                      onChange={() => {
                        if (allLibrarySelected) {
                          setSelectedFontRelPaths([]);
                        } else {
                          setSelectedFontRelPaths(
                            branding.importedWorkspaceFonts.map(
                              (f) => f.relativePath,
                            ),
                          );
                        }
                      }}
                      aria-label="Tout sélectionner"
                    />
                  </div>
                  <div className="min-w-0 flex-1" aria-hidden />
                  <div className="flex w-full shrink-0 basis-full flex-wrap items-center justify-end gap-1 sm:w-auto sm:basis-auto sm:min-w-0">
                    <WorkspacePdfFontMovePopover
                      open={movePopoverOpen}
                      onOpenChange={setMovePopoverOpen}
                      triggerDisabled={
                        fontImportBusy ||
                        fontLibraryBusy ||
                        fontFolderRenameBusy ||
                        selectedFontRelPaths.length === 0
                      }
                      destinationFolderKeys={sortedDestinationFolderKeys}
                      busy={fontLibraryBusy}
                      customFolder={moveCustomFolder}
                      onCustomFolderChange={setMoveCustomFolder}
                      onMoveTo={(k) => void moveSelectionToFolder(k)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 shrink-0 border-0 p-0 text-red-600 shadow-none hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      title="Supprimer la sélection"
                      disabled={
                        fontImportBusy ||
                        fontLibraryBusy ||
                        selectedFontRelPaths.length === 0
                      }
                      onClick={() =>
                        void removeWorkspaceFontsFromDiskAndState(
                          selectedFontRelPaths,
                        )
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Supprimer la sélection</span>
                    </Button>
                  </div>
                </div>
                <div
                  className="scrollbar-none max-h-[min(28rem,55vh)] min-h-0 overflow-y-auto overscroll-contain"
                  role="region"
                  aria-label="Liste des polices importées"
                >
                {libraryUsesFolderHeaders ? (
                  <div className="divide-y divide-[var(--color-border)]">
                    {fontGroups.map(({ key, fonts: folderFonts }) => {
                      const folderOpen = openFontFolders[key] !== false;
                      const renaming = folderRenameKey === key && key !== "";
                      return (
                        <div key={key || "__root__"}>
                          {renaming ? (
                            <div className="space-y-1.5 border-b border-[var(--color-border)] px-2 py-2">
                              <Label className="text-xs text-[var(--color-muted-foreground)]">
                                Nouveau chemin sous{" "}
                                <span className="font-mono text-[var(--color-foreground)]">
                                  fonts/
                                </span>{" "}
                                (segments séparés par{" "}
                                <span className="font-mono">/</span>, ex.{" "}
                                <span className="font-mono">Famille/Gras</span>)
                              </Label>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Input
                                  className="h-8 min-w-[12rem] flex-1 font-mono text-xs"
                                  value={folderRenameDraft}
                                  disabled={fontFolderRenameBusy}
                                  onChange={(e) =>
                                    setFolderRenameDraft(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      void confirmFolderRename();
                                    }
                                    if (e.key === "Escape") cancelFolderRename();
                                  }}
                                  autoFocus
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8"
                                  disabled={fontFolderRenameBusy}
                                  onClick={() => void confirmFolderRename()}
                                >
                                  <Check
                                    className="h-3.5 w-3.5"
                                    aria-hidden
                                  />
                                  <span className="sr-only">Valider</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  disabled={fontFolderRenameBusy}
                                  onClick={cancelFolderRename}
                                >
                                  <X className="h-3.5 w-3.5" aria-hidden />
                                  <span className="sr-only">Annuler</span>
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5 border-b border-[var(--color-border)]">
                              <button
                                type="button"
                                className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1.5 text-left text-xs font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)]/35"
                                aria-expanded={folderOpen}
                                onClick={() =>
                                  setOpenFontFolders((o) => {
                                    const wasOpen = o[key] !== false;
                                    return { ...o, [key]: !wasOpen };
                                  })
                                }
                              >
                                <ChevronRight
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0 transition-transform",
                                    folderOpen && "rotate-90",
                                  )}
                                  aria-hidden
                                />
                                <Folder
                                  className="h-3.5 w-3.5 shrink-0 opacity-80"
                                  aria-hidden
                                />
                                <span className="min-w-0 flex-1 truncate">
                                  {folderLabelForKey(key)}
                                </span>
                                <span className="shrink-0 tabular-nums opacity-70">
                                  ({folderFonts.length})
                                </span>
                              </button>
                              {key !== "" ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 shrink-0 p-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                                  disabled={
                                    fontImportBusy ||
                                    fontLibraryBusy ||
                                    fontFolderRenameBusy
                                  }
                                  title="Renommer le dossier"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setFolderRenameKey(key);
                                    setFolderRenameDraft(key);
                                  }}
                                >
                                  <Pencil
                                    className="h-3.5 w-3.5"
                                    aria-hidden
                                  />
                                  <span className="sr-only">
                                    Renommer le dossier
                                  </span>
                                </Button>
                              ) : null}
                            </div>
                          )}
                          {folderOpen ? (
                            <ul role="list" className="divide-y divide-[var(--color-border)]">
                              {folderFonts.map((f) => (
                                <FontLibraryRow
                                  key={f.relativePath}
                                  font={f}
                                  indent
                                  branding={branding}
                                  selectedFontRelPaths={selectedFontRelPaths}
                                  setSelectedFontRelPaths={setSelectedFontRelPaths}
                                  fontImportBusy={fontImportBusy}
                                  fontLibraryBusy={fontLibraryBusy}
                                />
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <ul
                    className="divide-y divide-[var(--color-border)]"
                    role="list"
                    aria-label="Polices importées"
                  >
                    {(fontGroups[0]?.fonts ?? []).map((f) => (
                      <FontLibraryRow
                        key={f.relativePath}
                        font={f}
                        indent={false}
                        branding={branding}
                        selectedFontRelPaths={selectedFontRelPaths}
                        setSelectedFontRelPaths={setSelectedFontRelPaths}
                        fontImportBusy={fontImportBusy}
                        fontLibraryBusy={fontLibraryBusy}
                      />
                    ))}
                  </ul>
                )}
                </div>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                La suppression retire l&apos;entrée et efface le fichier dans
                les données de l&apos;application.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
