import type * as api from "@/lib/api";

export type QuoteDayGroup = { day: string; items: api.Quote[] };

export function formatQuoteDayHeading(isoDay: string): string {
  const p = isoDay.split("-").map(Number);
  const y = p[0]!;
  const mo = p[1]!;
  const d = p[2]!;
  const dt = new Date(y, mo - 1, d);
  return dt.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function groupQuotesByDay(quotes: api.Quote[]): QuoteDayGroup[] {
  const sorted = [...quotes].sort((a, b) => {
    const d = b.issueDate.localeCompare(a.issueDate);
    if (d !== 0) return d;
    return b.id.localeCompare(a.id);
  });
  const out: { day: string; items: api.Quote[] }[] = [];
  let cur: string | null = null;
  let bucket: api.Quote[] = [];
  for (const q of sorted) {
    const day = q.issueDate.slice(0, 10);
    if (day !== cur) {
      if (cur !== null) out.push({ day: cur, items: bucket });
      cur = day;
      bucket = [];
    }
    bucket.push(q);
  }
  if (cur !== null) out.push({ day: cur, items: bucket });
  return out;
}
