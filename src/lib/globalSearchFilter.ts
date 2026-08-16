import { parseArticleOptionsJson } from "@/lib/articleOptions";
import type { Article, Category, Client, Invoice, Quote } from "@/lib/api";

export function globalSearchNormalized(raw: string): string {
  return raw.trim().toLowerCase();
}

export function clientMatchesGlobalSearch(
  c: Client,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return true;
  const blob = [c.name, c.email ?? "", c.phone ?? "", c.notes ?? ""].join(" ");
  return blob.toLowerCase().includes(normalizedQuery);
}

export function quoteMatchesGlobalSearch(
  q: Quote,
  clientName: string,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return true;
  const blob = `${q.number} ${q.title} ${clientName} ${q.status}`.toLowerCase();
  return blob.includes(normalizedQuery);
}

export function invoiceMatchesGlobalSearch(
  inv: Invoice,
  clientName: string,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return true;
  const blob = `${inv.number} ${clientName} ${inv.status}`.toLowerCase();
  return blob.includes(normalizedQuery);
}

export function articleMatchesGlobalSearch(
  a: Article,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return true;
  if (a.name.toLowerCase().includes(normalizedQuery)) return true;
  const { variants } = parseArticleOptionsJson(a.optionsJson);
  return variants.some((v) =>
    v.label.trim().toLowerCase().includes(normalizedQuery),
  );
}

/** Pour l’arborescence catalogue : catégories à afficher et articles visibles. */
export function buildCatalogVisibility(
  categories: Category[],
  articles: Article[],
  normalizedQuery: string,
): { categoryIds: Set<string>; matchingArticleIds: Set<string> } {
  if (!normalizedQuery) {
    return {
      categoryIds: new Set(categories.map((c) => c.id)),
      matchingArticleIds: new Set(articles.map((a) => a.id)),
    };
  }

  const byId = new Map(categories.map((c) => [c.id, c] as const));
  const categoryIds = new Set<string>();

  function addAncestors(catId: string | null) {
    let id: string | null = catId;
    while (id) {
      categoryIds.add(id);
      id = byId.get(id)?.parentId ?? null;
    }
  }

  const matchingArticleIds = new Set<string>();
  for (const a of articles) {
    if (articleMatchesGlobalSearch(a, normalizedQuery)) {
      matchingArticleIds.add(a.id);
      addAncestors(a.categoryId ?? null);
    }
  }

  for (const c of categories) {
    if (c.name.toLowerCase().includes(normalizedQuery)) {
      addAncestors(c.id);
    }
  }

  return { categoryIds, matchingArticleIds };
}
