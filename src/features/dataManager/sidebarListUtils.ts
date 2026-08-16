/** Taille de page pour la liste dans la sidebar (affichage seulement). */
export const SIDEBAR_PAGE_SIZE = 40;

export function normalizeSearch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function matchesSearch(haystack: string, normQuery: string): boolean {
  if (!normQuery) return true;
  const n = normalizeSearch(haystack);
  return n.includes(normQuery);
}

export function paginateSlice<T>(
  items: T[],
  page: number,
  pageSize: number,
): { slice: T[]; pageCount: number; total: number } {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const p = Math.min(Math.max(0, page), pageCount - 1);
  const start = p * pageSize;
  const slice = items.slice(start, start + pageSize);
  return { slice, pageCount, total };
}
