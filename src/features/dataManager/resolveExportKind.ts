import { parseArticlesSelection } from "@/features/dataManager/moduleIds";

export type ArticleExportFilter =
  | { mode: "all" }
  | { mode: "uncat" }
  | { mode: "category"; categoryId: string };

export function exportKindForSelection(selectionId: string): {
  kind: string;
  articleFilter?: ArticleExportFilter;
} | null {
  if (selectionId === "workspace") return null;
  if (selectionId === "history") return null;
  if (selectionId === "clients") return { kind: "clients" };
  if (selectionId === "categories") return { kind: "categories" };
  if (selectionId === "quotes") return { kind: "quotes" };
  if (selectionId === "invoices") return { kind: "invoices" };
  if (selectionId === "projects") return { kind: "projects" };
  if (selectionId === "tax-rates") return { kind: "tax-rates" };
  if (selectionId === "discount-presets") return { kind: "discount-presets" };
  if (selectionId === "snippets") return { kind: "snippets" };
  const art = parseArticlesSelection(selectionId);
  if (art?.tag === "all") return { kind: "articles", articleFilter: { mode: "all" } };
  if (art?.tag === "uncat")
    return { kind: "articles", articleFilter: { mode: "uncat" } };
  if (art?.tag === "category") {
    return {
      kind: "articles",
      articleFilter: { mode: "category", categoryId: art.categoryId },
    };
  }
  return null;
}
