import type { BrandingImportedWorkspaceFont } from "@/lib/documentOptions";

/** Dossier relatif sous `fonts/` (vide = fichiers à la racine). */
export function workspaceFontFolderKey(
  relativePath: string,
  workspaceId: string,
): string {
  const prefix = `workspace_assets/${workspaceId}/fonts/`;
  if (!relativePath.startsWith(prefix)) return "";
  const tail = relativePath.slice(prefix.length);
  const i = tail.lastIndexOf("/");
  return i <= 0 ? "" : tail.slice(0, i);
}

export function sortFolderKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    if (a === "" && b !== "") return -1;
    if (b === "" && a !== "") return 1;
    return a.localeCompare(b, "fr", { sensitivity: "base" });
  });
}

export function groupImportedFontsByFolder(
  fonts: BrandingImportedWorkspaceFont[],
  workspaceId: string,
): Map<string, BrandingImportedWorkspaceFont[]> {
  const map = new Map<string, BrandingImportedWorkspaceFont[]>();
  for (const f of fonts) {
    const key = workspaceFontFolderKey(f.relativePath, workspaceId);
    const list = map.get(key) ?? [];
    list.push(f);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) =>
      a.label.localeCompare(b.label, "fr", { sensitivity: "base" }),
    );
  }
  return map;
}

export function folderLabelForKey(folderKey: string): string {
  if (folderKey === "") return "Racine";
  return folderKey.split("/").join(" › ");
}
