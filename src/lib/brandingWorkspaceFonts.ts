import type {
  BrandingImportedWorkspaceFont,
  BrandingState,
} from "@/lib/documentOptions";

export function upsertImportedWorkspaceFont(
  list: BrandingImportedWorkspaceFont[],
  entry: BrandingImportedWorkspaceFont,
): BrandingImportedWorkspaceFont[] {
  const idx = list.findIndex((e) => e.relativePath === entry.relativePath);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = entry;
    return next;
  }
  return [...list, entry];
}

export function removeWorkspaceFontsFromState(
  prev: BrandingState,
  relativePaths: string[],
): BrandingState {
  const drop = new Set(relativePaths);
  const importedWorkspaceFonts = prev.importedWorkspaceFonts.filter(
    (e) => !drop.has(e.relativePath),
  );
  let pdfFont = prev.pdfFont;
  if (pdfFont.kind === "workspace" && drop.has(pdfFont.relativePath)) {
    pdfFont = { kind: "builtin", builtinId: "helvetica" };
  }
  return { ...prev, importedWorkspaceFonts, pdfFont };
}

/** Met à jour les chemins après renommage d’un dossier sous `fonts/`. */
export function applyRenamedFontFolderInBranding(
  prev: BrandingState,
  workspaceId: string,
  fromKey: string,
  toKey: string,
): BrandingState {
  const oldP = `workspace_assets/${workspaceId}/fonts/${fromKey}/`;
  const newP = `workspace_assets/${workspaceId}/fonts/${toKey}/`;
  const mapPath = (rel: string) =>
    rel.startsWith(oldP) ? newP + rel.slice(oldP.length) : rel;
  const importedWorkspaceFonts = prev.importedWorkspaceFonts.map((e) =>
    e.relativePath.startsWith(oldP)
      ? { ...e, relativePath: mapPath(e.relativePath) }
      : e,
  );
  let pdfFont = prev.pdfFont;
  if (pdfFont.kind === "workspace" && pdfFont.relativePath.startsWith(oldP)) {
    pdfFont = {
      ...pdfFont,
      relativePath: mapPath(pdfFont.relativePath),
    };
  }
  return { ...prev, importedWorkspaceFonts, pdfFont };
}

export function applyMovedFontsInBranding(
  prev: BrandingState,
  moves: { oldRelativePath: string; newRelativePath: string }[],
): BrandingState {
  const map = new Map(
    moves.map((m) => [m.oldRelativePath, m.newRelativePath]),
  );
  const importedWorkspaceFonts = prev.importedWorkspaceFonts.map((e) => {
    const n = map.get(e.relativePath);
    return n ? { ...e, relativePath: n } : e;
  });
  let pdfFont = prev.pdfFont;
  if (pdfFont.kind === "workspace") {
    const n = map.get(pdfFont.relativePath);
    if (n) {
      pdfFont = { ...pdfFont, relativePath: n };
    }
  }
  return { ...prev, importedWorkspaceFonts, pdfFont };
}
