/**
 * Moteur de calcul document (lignes, taxes, marge) — logique pure, testable.
 */

/**
 * Arrondi HT selon le nombre de décimales (limite les artefacts flottants après + / ×).
 * `fractionDigits` est borné à [0, 8] pour rester numériquement raisonnable.
 */
export function roundMoneyHt(n: number, fractionDigits: number): number {
  if (!Number.isFinite(n)) return 0;
  const d = Math.min(8, Math.max(0, Math.trunc(fractionDigits)));
  if (d === 0) return Math.round(n);
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/** Arrondi monétaire HT à 2 décimales (défaut historique). */
export function roundMoneyHt2(n: number): number {
  return roundMoneyHt(n, 2);
}

export type LineInput = {
  quantity: number;
  unitPrice: number;
  taxRatePercent: number;
  /** Remise sur le HT de la ligne (optionnel) — avant remise document. */
  lineDiscountKind?: string | null;
  lineDiscountValue?: number | null;
};

export type LineComputed = {
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
};

export type DiscountKind = "none" | "percent" | "fixed";

export function normalizeDiscountKind(raw: string | null | undefined): DiscountKind {
  const t = raw?.trim();
  if (t === "percent" || t === "fixed") return t;
  return "none";
}

/** HT brut ligne (catalogue) : qté × PU. */
export function lineGrossHt(line: Pick<LineInput, "quantity" | "unitPrice">): number {
  return line.quantity * line.unitPrice;
}

/** Net HT après remise ligne (aligné Rust `apply_line_discount_ht`). */
export function applyLineDiscountHt(
  grossHt: number,
  kind: DiscountKind,
  value: number,
): number {
  const v = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (kind === "none" || v <= 0) return grossHt;
  if (kind === "percent") {
    const p = Math.min(100, Math.max(0, v));
    return grossHt * (1 - p / 100);
  }
  return Math.max(0, grossHt - v);
}

export function computeLine(
  line: LineInput,
  taxExempt: boolean,
): LineComputed {
  const gross = lineGrossHt(line);
  const dk = normalizeDiscountKind(line.lineDiscountKind);
  const dv = line.lineDiscountValue ?? 0;
  const lineSubtotal = applyLineDiscountHt(gross, dk, dv);
  const lineTax = taxExempt
    ? 0
    : lineSubtotal * (line.taxRatePercent / 100);
  const lineTotal = lineSubtotal + lineTax;
  return { lineSubtotal, lineTax, lineTotal };
}

export function sumDocumentLines(
  lines: LineInput[],
  taxExempt: boolean,
): { subtotal: number; taxTotal: number; total: number; details: LineComputed[] } {
  const details = lines.map((l) => computeLine(l, taxExempt));
  const subtotal = details.reduce((s, d) => s + d.lineSubtotal, 0);
  const taxTotal = details.reduce((s, d) => s + d.lineTax, 0);
  const total = details.reduce((s, d) => s + d.lineTotal, 0);
  return { subtotal, taxTotal, total, details };
}

/** Somme des HT catalogue (qté × PU) — avant remises lignes. */
export function sumLineCatalogueGrossHt(lines: LineInput[]): number {
  return lines.reduce((s, l) => s + lineGrossHt(l), 0);
}

/** Total HT des remises au niveau ligne (somme des brut − net par ligne). */
export function sumLineDiscountsHtAmount(lines: LineInput[]): number {
  let t = 0;
  for (const l of lines) {
    const g = lineGrossHt(l);
    const dk = normalizeDiscountKind(l.lineDiscountKind);
    const dv = l.lineDiscountValue ?? 0;
    const n = applyLineDiscountHt(g, dk, dv);
    t += g - n;
  }
  return t;
}

/**
 * Remise globale sur le HT des lignes ; TVA au prorata (aligné backend Rust).
 */
export function applyDocumentDiscount(
  grossSubtotal: number,
  grossTax: number,
  taxExempt: boolean,
  kind: DiscountKind,
  value: number,
): { subtotal: number; taxTotal: number; total: number } {
  const grossTotal = grossSubtotal + grossTax;
  const v = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (kind === "none" || v <= 0) {
    return {
      subtotal: grossSubtotal,
      taxTotal: grossTax,
      total: grossTotal,
    };
  }
  let netHt: number;
  if (kind === "percent") {
    const p = Math.min(100, Math.max(0, v));
    netHt = grossSubtotal * (1 - p / 100);
  } else {
    netHt = Math.max(0, grossSubtotal - v);
  }
  const netTax = taxExempt
    ? 0
    : grossSubtotal > 0
      ? grossTax * (netHt / grossSubtotal)
      : 0;
  return {
    subtotal: netHt,
    taxTotal: netTax,
    total: netHt + netTax,
  };
}

/** Montant HT de la remise (positif) pour affichage PDF. */
export function discountAmountHt(
  grossSubtotal: number,
  kind: DiscountKind,
  value: number,
): number {
  const v = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (kind === "none" || v <= 0) return 0;
  if (kind === "percent") {
    const p = Math.min(100, Math.max(0, v));
    return grossSubtotal * (p / 100);
  }
  return Math.min(grossSubtotal, v);
}

/** Marge interne (HT) : (prix unitaire HT × qté) − (coût × qté) */
export function computeMarginValue(
  quantity: number,
  unitPriceExclTax: number,
  productionCostPerUnit: number | null | undefined,
): number | null {
  if (productionCostPerUnit == null || Number.isNaN(productionCostPerUnit)) {
    return null;
  }
  return quantity * (unitPriceExclTax - productionCostPerUnit);
}

export function computeMarginPercent(
  marginValue: number | null,
  revenueExclTax: number,
): number | null {
  if (marginValue == null || revenueExclTax <= 0) return null;
  return (marginValue / revenueExclTax) * 100;
}

export function isBelowProductionCost(
  unitPriceExclTax: number,
  productionCostPerUnit: number | null | undefined,
): boolean {
  if (productionCostPerUnit == null || Number.isNaN(productionCostPerUnit)) {
    return false;
  }
  return unitPriceExclTax < productionCostPerUnit;
}
