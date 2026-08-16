import { ipc } from "@/lib/apiCore";

/** Bureau : contenu Base64 du fichier de police (chemins autorisés uniquement). */
export async function readFontFileBase64(
  path: string,
  faceIndex: number,
): Promise<string> {
  return ipc("read_font_file_base64", { path, faceIndex });
}

export async function pickLogoFilePath(): Promise<string | null> {
  const r = await ipc<string | null | undefined>("pick_logo_file_path");
  return r ?? null;
}

/** Bureau : dialogue pour choisir un fichier .ttf / .otf / .ttc. */
export async function pickPdfFontFilePath(): Promise<string | null> {
  const r = await ipc<string | null | undefined>("pick_pdf_font_file_path");
  return r ?? null;
}

/** Bureau : dialogue pour choisir un dossier (import polices, premier niveau). */
export async function pickPdfFontFolderPath(): Promise<string | null> {
  const r = await ipc<string | null | undefined>("pick_pdf_font_folder_path");
  return r ?? null;
}

export type WorkspaceFontFolderRow = {
  relativePath: string;
  label: string;
};

/** Bureau : copie une police choisie par l’utilisateur vers workspace_assets/.../fonts/. */
export async function importWorkspacePdfFontFromPath(
  workspaceId: string,
  sourcePath: string,
  faceIndex: number,
): Promise<string> {
  return ipc("import_workspace_pdf_font_from_path", {
    workspaceId,
    sourcePath,
    faceIndex,
  });
}

/** Bureau : copie chaque .ttf / .otf / .ttc du dossier (récursif, face 0 pour les .ttc). */
export async function importWorkspacePdfFontsFromFolder(
  workspaceId: string,
  folderPath: string,
): Promise<WorkspaceFontFolderRow[]> {
  return ipc("import_workspace_pdf_fonts_from_folder", {
    workspaceId,
    folderPath,
  });
}

/** Bureau : supprime les fichiers sous `workspace_assets/.../fonts/` (chemins relatifs validés). */
export async function deleteWorkspacePdfFonts(
  workspaceId: string,
  relativePaths: string[],
): Promise<void> {
  if (relativePaths.length === 0) return;
  return ipc("delete_workspace_pdf_fonts", {
    workspaceId,
    relativePaths,
  });
}

export type RenameWorkspacePdfFontFolderResult = {
  fromKey: string;
  toKey: string;
};

/** Bureau : renomme un dossier sous `fonts/` (clés avec `/`, ex. `Famille/Gras`). */
export async function renameWorkspacePdfFontFolder(
  workspaceId: string,
  fromKey: string,
  toKey: string,
): Promise<RenameWorkspacePdfFontFolderResult> {
  return ipc("rename_workspace_pdf_font_folder", {
    workspaceId,
    fromKey,
    toKey,
  });
}

export type MoveWorkspacePdfFontRow = {
  oldRelativePath: string;
  newRelativePath: string;
};

/** Bureau : déplace des fichiers police vers un dossier sous `fonts/` (chaîne vide = racine). */
export async function moveWorkspacePdfFontsToFolder(
  workspaceId: string,
  relativePaths: string[],
  targetFolderKey: string,
): Promise<MoveWorkspacePdfFontRow[]> {
  if (relativePaths.length === 0) return [];
  return ipc("move_workspace_pdf_fonts_to_folder", {
    workspaceId,
    relativePaths,
    targetFolderKey,
  });
}

/** Bureau : ouvre le sélecteur de dossier système (Finder, Explorateur…). */
export async function pickPdfOutputDir(): Promise<string | null> {
  const r = await ipc<string | null | undefined>("pick_pdf_output_dir");
  return r ?? null;
}

export async function copyWorkspaceLogoFromPath(
  workspaceId: string,
  sourcePath: string,
): Promise<string> {
  return ipc("copy_workspace_logo_from_path", { workspaceId, sourcePath });
}

export async function readWorkspaceAssetBase64(
  workspaceId: string,
  relativePath: string,
): Promise<string | null> {
  return ipc("read_workspace_asset_base64", { workspaceId, relativePath });
}

export async function writePdfFile(
  path: string,
  data: Uint8Array,
): Promise<void> {
  return ipc("write_pdf_file", { path, data: Array.from(data) });
}

/** Bureau uniquement : écrit le PDF dans le cache app et retourne le chemin absolu pour `openPath`. */
export async function writePdfPreviewTemp(data: Uint8Array): Promise<string> {
  return ipc("write_pdf_preview_temp", { data: Array.from(data) });
}
