import type { Category } from "@/lib/api";

export function sortCategories(cats: Category[]): Category[] {
  return [...cats].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fr"),
  );
}

export function buildChildrenMap(
  categories: Category[],
): Map<string | null, Category[]> {
  const map = new Map<string | null, Category[]>();
  for (const c of categories) {
    const p = c.parentId ?? null;
    if (!map.has(p)) map.set(p, []);
    map.get(p)!.push(c);
  }
  for (const list of map.values()) sortCategories(list);
  return map;
}

export function idsToExpandForCategory(
  categoryId: string,
  byId: Map<string, Category>,
): string[] {
  const out: string[] = [categoryId];
  let cur = byId.get(categoryId);
  while (cur?.parentId) {
    out.push(cur.parentId);
    cur = byId.get(cur.parentId);
  }
  return out;
}
