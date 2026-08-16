import type { Article, Category } from "@/lib/api";
import type { StockLevelRow } from "@/lib/api";

export function categoryPathLabel(
  categoryId: string | null | undefined,
  byId: Map<string, Category>,
): string {
  if (!categoryId?.trim()) return "Sans catégorie";
  const names: string[] = [];
  let cur: Category | undefined = byId.get(categoryId.trim());
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    names.push(cur.name);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return names.length ? names.reverse().join(" › ") : "Sans catégorie";
}

export type MergedCatalogStockRow = {
  articleId: string;
  articleName: string;
  categoryPath: string;
  supplierName: string;
  supplierReference: string;
  quantity: number;
  updatedAt: string;
  /** Mouvements ou fiche de niveau : permet d’effacer la surcouche stock sans toucher au catalogue. */
  hasStockData: boolean;
};

/** Affichage lisible pour la colonne « Dernière maj. » (évite l’ISO brut). */
export function formatStockLevelsUpdatedAt(raw: string): string {
  const t = raw.trim();
  if (!t || t === "—") return "—";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return t;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function mergeCatalogStockRows(
  articles: Article[],
  categories: Category[],
  levels: StockLevelRow[],
): MergedCatalogStockRow[] {
  const byId = new Map(categories.map((c) => [c.id, c] as const));
  const levelByArticle = new Map(
    levels.map((l) => [l.articleId, l] as const),
  );
  const rows = articles.map((a) => {
    const l = levelByArticle.get(a.id);
    const qty = l?.quantity ?? 0;
    const updatedAt = l?.updatedAt ?? "—";
    const hasStockData =
      updatedAt !== "—" || Math.abs(qty) > 1e-9;
    const sup = a.supplierName?.trim() ?? "";
    const ref = a.supplierReference?.trim() ?? "";
    return {
      articleId: a.id,
      articleName: a.name,
      categoryPath: categoryPathLabel(a.categoryId, byId),
      supplierName: sup,
      supplierReference: ref,
      quantity: qty,
      updatedAt,
      hasStockData,
    };
  });
  rows.sort(
    (x, y) =>
      x.categoryPath.localeCompare(y.categoryPath, "fr") ||
      x.articleName.localeCompare(y.articleName, "fr"),
  );
  return rows;
}
