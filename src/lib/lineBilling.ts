import type { Article } from "@/lib/api";

export type LineBillingMode = "unit" | "flat" | "hourly";

export function normalizeLineBillingMode(
  v: string | null | undefined,
): LineBillingMode {
  if (v === "flat" || v === "hourly") return v;
  return "unit";
}

/** Prix HT à utiliser sur la ligne selon le mode (champs catalogue). */
export function unitPriceForArticleMode(
  article: Article,
  mode: LineBillingMode,
): number {
  if (mode === "flat") return article.flatPrice ?? 0;
  if (mode === "hourly") return article.hourlyRate ?? 0;
  return article.basePrice;
}

export function quantityDefaultForMode(
  mode: LineBillingMode,
  previousQty: number,
): number {
  if (mode === "flat") return 1;
  if (previousQty > 0) return previousQty;
  return 1;
}
