/** Identifiants feuilles (hors arbre catalogue dynamique). */
export type DataLeafModuleId =
  | "clients"
  | "categories"
  | "articles:all"
  | "quotes"
  | "invoices"
  | "tax-rates"
  | "discount-presets"
  | "snippets"
  | "history";

export type ParsedArticlesSelection =
  | { tag: "all" }
  | { tag: "uncat" }
  | { tag: "category"; categoryId: string };

export function parseArticlesSelection(
  id: string,
): ParsedArticlesSelection | null {
  if (id === "articles:all") return { tag: "all" };
  if (id === "articles:uncat") return { tag: "uncat" };
  if (id.startsWith("articles:cat:")) {
    return { tag: "category", categoryId: id.slice("articles:cat:".length) };
  }
  return null;
}

export function isLeafModuleId(id: string): id is DataLeafModuleId {
  return (
    id === "clients" ||
    id === "categories" ||
    id === "articles:all" ||
    id === "quotes" ||
    id === "invoices" ||
    id === "tax-rates" ||
    id === "discount-presets" ||
    id === "snippets" ||
    id === "history" ||
    id.startsWith("articles:cat:") ||
    id === "articles:uncat"
  );
}

/** Clé `kind` pour codec v1 / historique. */
export function historyModuleForSelection(selectionId: string): string {
  if (selectionId.startsWith("articles:")) return "articles";
  return selectionId;
}
