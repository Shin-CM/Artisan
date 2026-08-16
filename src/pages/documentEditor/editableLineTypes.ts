/** Ligne éditable partagée entre les pages Devis / Factures (tableau articles). */

import type { LineBillingMode } from "@/lib/lineBilling";

export type LineDiscountFormKind = "none" | "percent" | "fixed";

export type QuoteEditableLine = {
  id: string | null;
  articleId: string | null;
  description: string;
  /** JSON string (snapshot variante catalogue), `{}` si sans trace. */
  optionsSnapshotJson: string;
  billingMode: LineBillingMode;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxManual?: boolean;
  lineNote: string;
  showNoteOnQuote: boolean;
  lineDiscountKind: LineDiscountFormKind;
  lineDiscountValue: number;
  lineDiscountLabel: string;
};

export type InvoiceEditableLine = {
  id: string | null;
  articleId: string | null;
  description: string;
  /** JSON string (snapshot variante catalogue), `{}` si sans trace. */
  optionsSnapshotJson: string;
  billingMode: LineBillingMode;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxManual?: boolean;
  lineNote: string;
  showNoteOnInvoice: boolean;
  lineDiscountKind: LineDiscountFormKind;
  lineDiscountValue: number;
  lineDiscountLabel: string;
};

export function emptyQuoteLine(opts?: { defaultTaxRate?: number }): QuoteEditableLine {
  const taxRate = opts?.defaultTaxRate ?? 20;
  return {
    id: null,
    articleId: null,
    description: "Prestation",
    optionsSnapshotJson: "{}",
    billingMode: "unit",
    quantity: 1,
    unitPrice: 0,
    taxRate,
    taxManual: false,
    lineNote: "",
    showNoteOnQuote: false,
    lineDiscountKind: "none",
    lineDiscountValue: 0,
    lineDiscountLabel: "",
  };
}

export function emptyInvoiceLine(opts?: {
  defaultTaxRate?: number;
}): InvoiceEditableLine {
  const taxRate = opts?.defaultTaxRate ?? 20;
  return {
    id: null,
    articleId: null,
    description: "Prestation",
    optionsSnapshotJson: "{}",
    billingMode: "unit",
    quantity: 1,
    unitPrice: 0,
    taxRate,
    taxManual: false,
    lineNote: "",
    showNoteOnInvoice: false,
    lineDiscountKind: "none",
    lineDiscountValue: 0,
    lineDiscountLabel: "",
  };
}
