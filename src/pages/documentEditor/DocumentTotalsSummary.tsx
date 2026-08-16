import * as React from "react";

export function DocumentTotalsSummary({
  fmt,
  subtotal,
  taxTotal,
  total,
  children,
  discountBefore,
  documentSurface = false,
}: {
  fmt: (n: number) => string;
  subtotal: number;
  taxTotal: number;
  total: number;
  children?: React.ReactNode;
  /** Si défini : lignes « avant remise » puis sous-total HT = net (`subtotal`). */
  discountBefore?: {
    grossSubtotal: number;
    discountAmountHt: number;
    label: string | null;
  };
  /** Intégré dans une feuille devis sans encadré séparé. */
  documentSurface?: boolean;
}) {
  const discLabel =
    discountBefore?.label?.trim() || "Réduction commerciale";
  return (
    <div
      className={
        documentSurface
          ? "ml-auto max-w-xs space-y-1 border-t border-[var(--color-border)] py-3 text-sm"
          : "max-w-xs space-y-1 rounded-md border border-[var(--color-border)] p-3 text-sm"
      }
    >
      {discountBefore && discountBefore.discountAmountHt > 0 ? (
        <>
          <div className="flex justify-between text-[var(--color-muted-foreground)]">
            <span>Total HT (lignes)</span>
            <span>{fmt(discountBefore.grossSubtotal)}</span>
          </div>
          <div className="flex justify-between text-[var(--color-muted-foreground)]">
            <span className="pr-2">{discLabel}</span>
            <span>−{fmt(discountBefore.discountAmountHt)}</span>
          </div>
        </>
      ) : null}
      <div className="flex justify-between">
        <span>Sous-total HT</span>
        <span>{fmt(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>TVA</span>
        <span>{fmt(taxTotal)}</span>
      </div>
      <div className="flex justify-between font-semibold">
        <span>Total TTC</span>
        <span>{fmt(total)}</span>
      </div>
      {children}
    </div>
  );
}
