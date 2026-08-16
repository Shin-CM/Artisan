import {
  applyDocumentDiscount,
  discountAmountHt,
  normalizeDiscountKind,
  sumDocumentLines,
} from "@/core/documentMath";

/** Ligne éditable minimale pour le calcul HT / remise (devis ou facture). */
export type DiscountableLine = {
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineDiscountKind?: string | null;
  lineDiscountValue?: number | null;
};

/** Entrée pour sumDocumentLines / PDF (même forme que le retour `lineInputs`). */
export type DocumentLineMathInput = {
  quantity: number;
  unitPrice: number;
  taxRatePercent: number;
  lineDiscountKind?: string | null;
  lineDiscountValue?: number | null;
};

export type DocumentDiscountFormKind = "none" | "percent" | "fixed";

/** Agrégats et remise alignés sur la logique métier partagée avec le backend. */
export function computeDocumentDiscountDerived(
  lines: DiscountableLine[],
  taxExempt: boolean,
  discountKind: DocumentDiscountFormKind,
  discountValue: number,
  discountLabel: string,
) {
  const lineInputs = lines.map((l) => ({
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRatePercent: l.taxRate,
    lineDiscountKind: l.lineDiscountKind ?? null,
    lineDiscountValue: l.lineDiscountValue ?? null,
  }));
  const grossTotals = sumDocumentLines(lineInputs, taxExempt);
  const discKindNorm = normalizeDiscountKind(discountKind);
  const discValSafe = Number.isFinite(discountValue)
    ? Math.max(0, discountValue)
    : 0;
  const totals = applyDocumentDiscount(
    grossTotals.subtotal,
    grossTotals.taxTotal,
    taxExempt,
    discKindNorm,
    discValSafe,
  );
  const discountBefore =
    discKindNorm !== "none" && discValSafe > 0
      ? {
          grossSubtotal: grossTotals.subtotal,
          discountAmountHt: discountAmountHt(
            grossTotals.subtotal,
            discKindNorm,
            discValSafe,
          ),
          label: discountLabel.trim() || null,
        }
      : undefined;

  return {
    lineInputs,
    grossTotals,
    discKindNorm,
    discValSafe,
    totals,
    discountBefore,
  };
}
