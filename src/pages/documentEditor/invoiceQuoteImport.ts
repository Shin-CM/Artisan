import type * as api from "@/lib/api";
import { normalizeLineBillingMode } from "@/lib/lineBilling";
import { rateMatches } from "@/pages/documentEditor/taxFormat";
import { editorLineDiscountFromApi } from "@/pages/documentEditor/lineDiscountPayload";
import type { InvoiceEditableLine } from "@/pages/documentEditor/editableLineTypes";

export function mapQuoteLineToInvoiceEditable(
  ql: api.QuoteLine,
  taxRatesList: api.TaxRate[],
): InvoiceEditableLine {
  const matchesRegistered = taxRatesList.some((r) =>
    rateMatches(r.rate, ql.taxRate),
  );
  return {
    id: null,
    articleId: ql.articleId,
    description: ql.description,
    optionsSnapshotJson: ql.optionsSnapshotJson ?? "{}",
    billingMode: normalizeLineBillingMode(ql.billingMode),
    quantity: ql.quantity,
    unitPrice: ql.unitPrice,
    taxRate: ql.taxRate,
    taxManual: matchesRegistered ? false : true,
    lineNote: ql.lineNote ?? "",
    showNoteOnInvoice: ql.showNoteOnQuote,
    ...editorLineDiscountFromApi({
      lineDiscountKind: ql.lineDiscountKind,
      lineDiscountValue: ql.lineDiscountValue,
      lineDiscountLabel: ql.lineDiscountLabel,
    }),
  };
}
