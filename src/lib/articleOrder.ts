import type { Article, ArticleReorderItem } from "@/lib/api";

export function sortedArticlesInCategory(
  articles: Article[],
  categoryId: string | null,
): Article[] {
  return articles
    .filter((x) => (x.categoryId ?? null) === categoryId)
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.name.localeCompare(b.name, "fr"),
    );
}

/** Recalcule sortOrder 0..n-1 par catégorie à partir de l’état courant. */
export function flattenArticleReorderItemsFromState(
  articles: Article[],
): ArticleReorderItem[] {
  const byCat = new Map<string | null, Article[]>();
  for (const a of articles) {
    const k = a.categoryId;
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k)!.push(a);
  }
  const out: ArticleReorderItem[] = [];
  for (const [, list] of byCat) {
    const sorted = [...list].sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.name.localeCompare(b.name, "fr"),
    );
    sorted.forEach((x, i) =>
      out.push({ id: x.id, categoryId: x.categoryId, sortOrder: i }),
    );
  }
  return out;
}
