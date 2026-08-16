import type * as api from "@/lib/api";

/** Dernière entrée « ok » par module (libellé court pour la sidebar). */
export function lastOkImportByModule(
  history: api.ImportHistoryRow[],
): Map<string, { at: string; count: number }> {
  const map = new Map<string, { at: string; count: number }>();
  const sorted = [...history].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  for (const h of sorted) {
    if (h.status !== "ok") continue;
    if (!map.has(h.module)) {
      map.set(h.module, { at: h.createdAt.slice(0, 16).replace("T", " "), count: h.recordCount });
    }
  }
  return map;
}
