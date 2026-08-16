import type * as api from "@/lib/api";

export const UNCAT_KEY = "__uncat__";

export type FolderSel = "all" | "uncat" | string;

export function resolveCategoryIdForSave(
  folderSel: FolderSel,
  artSel: api.Article | null,
): string | null {
  if (folderSel === "uncat") return null;
  if (folderSel === "all") return artSel?.categoryId ?? null;
  return folderSel;
}

export function parentIdForNewCategory(folderSel: FolderSel): string | null {
  if (folderSel === "all" || folderSel === "uncat") return null;
  return folderSel;
}
