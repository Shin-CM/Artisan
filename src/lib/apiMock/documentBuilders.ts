import {
  applyDocumentDiscount,
  normalizeDiscountKind,
  sumDocumentLines,
} from "@/core/documentMath";
import { normalizeLineBillingMode } from "@/lib/lineBilling";
import type {
  InvoiceComplement,
  InvoiceInput,
  InvoiceLine,
  QuoteComplement,
  QuoteInput,
  QuoteLine,
} from "@/lib/api";
import { rid } from "@/lib/apiMock/store";

export function optsJson(v: unknown): string {
  try {
    return typeof v === "string" ? v : JSON.stringify(v ?? {});
  } catch {
    return "{}";
  }
}

export function buildQuoteLines(
  quoteId: string,
  input: QuoteInput,
  taxExempt: boolean,
): QuoteLine[] {
  const inputs = input.lines.map((l) => ({
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRatePercent: l.taxRate,
    lineDiscountKind: l.lineDiscountKind ?? null,
    lineDiscountValue: l.lineDiscountValue ?? null,
  }));
  const { details } = sumDocumentLines(inputs, taxExempt);
  return input.lines.map((l, i) => {
    const note =
      typeof l.lineNote === "string" && l.lineNote.trim()
        ? l.lineNote.trim()
        : null;
    const ld = mockPersistLineDiscountFields(l);
    return {
      id: l.id && typeof l.id === "string" ? l.id : rid(),
      quoteId,
      articleId: l.articleId ?? null,
      description: l.description,
      optionsSnapshotJson: optsJson(l.optionsSnapshotJson),
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineSubtotal: details[i]!.lineSubtotal,
      lineTax: details[i]!.lineTax,
      lineTotal: details[i]!.lineTotal,
      sortOrder: i,
      lineNote: note,
      showNoteOnQuote: l.showNoteOnQuote === true,
      billingMode: normalizeLineBillingMode(l.billingMode),
      ...ld,
    };
  });
}

export function buildInvoiceLines(
  invoiceId: string,
  input: InvoiceInput,
  taxExempt: boolean,
): InvoiceLine[] {
  const inputs = input.lines.map((l) => ({
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRatePercent: l.taxRate,
    lineDiscountKind: l.lineDiscountKind ?? null,
    lineDiscountValue: l.lineDiscountValue ?? null,
  }));
  const { details } = sumDocumentLines(inputs, taxExempt);
  return input.lines.map((l, i) => {
    const ld = mockPersistLineDiscountFields(l);
    return {
      id: rid(),
      invoiceId,
      articleId: l.articleId ?? null,
      description: l.description,
      optionsSnapshotJson: optsJson(l.optionsSnapshotJson),
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineSubtotal: details[i]!.lineSubtotal,
      lineTax: details[i]!.lineTax,
      lineTotal: details[i]!.lineTotal,
      sortOrder: i,
      lineNote: l.lineNote?.trim() ? l.lineNote.trim() : null,
      showNoteOnInvoice: l.showNoteOnInvoice === true,
      billingMode: normalizeLineBillingMode(l.billingMode),
      ...ld,
    };
  });
}

export function buildQuoteComplements(
  quoteId: string,
  input: QuoteInput,
): QuoteComplement[] {
  const raw = input.complements ?? [];
  return raw.map((c, i) => ({
    id: c.id && typeof c.id === "string" ? c.id : rid(),
    quoteId,
    sortOrder: i,
    snippetId:
      c.snippetId && typeof c.snippetId === "string" ? c.snippetId : null,
    body: typeof c.body === "string" ? c.body : "",
  }));
}

export function buildInvoiceComplements(
  invoiceId: string,
  input: InvoiceInput,
): InvoiceComplement[] {
  const raw = input.complements ?? [];
  return raw.map((c, i) => ({
    id: c.id && typeof c.id === "string" ? c.id : rid(),
    invoiceId,
    sortOrder: i,
    snippetId:
      c.snippetId && typeof c.snippetId === "string" ? c.snippetId : null,
    body: typeof c.body === "string" ? c.body : "",
  }));
}

export function quoteTotals(lines: QuoteLine[], taxExempt: boolean): {
  subtotal: number;
  taxTotal: number;
  total: number;
} {
  const inputs = lines.map((l) => ({
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRatePercent: l.taxRate,
    lineDiscountKind: l.lineDiscountKind,
    lineDiscountValue: l.lineDiscountValue,
  }));
  const s = sumDocumentLines(inputs, taxExempt);
  return { subtotal: s.subtotal, taxTotal: s.taxTotal, total: s.total };
}

export function quoteTotalsWithDiscount(
  lines: QuoteLine[],
  taxExempt: boolean,
  discountKind?: string | null,
  discountValue?: number | null,
): { subtotal: number; taxTotal: number; total: number } {
  const base = quoteTotals(lines, taxExempt);
  const kind = normalizeDiscountKind(discountKind);
  const v = discountValue ?? 0;
  return applyDocumentDiscount(
    base.subtotal,
    base.taxTotal,
    taxExempt,
    kind,
    v,
  );
}

export function invoiceTotals(lines: InvoiceLine[], taxExempt: boolean): {
  subtotal: number;
  taxTotal: number;
  total: number;
} {
  const inputs = lines.map((l) => ({
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRatePercent: l.taxRate,
    lineDiscountKind: l.lineDiscountKind,
    lineDiscountValue: l.lineDiscountValue,
  }));
  const s = sumDocumentLines(inputs, taxExempt);
  return { subtotal: s.subtotal, taxTotal: s.taxTotal, total: s.total };
}

export function invoiceTotalsWithDiscount(
  lines: InvoiceLine[],
  taxExempt: boolean,
  discountKind?: string | null,
  discountValue?: number | null,
): { subtotal: number; taxTotal: number; total: number } {
  const base = invoiceTotals(lines, taxExempt);
  const kind = normalizeDiscountKind(discountKind);
  const v = discountValue ?? 0;
  return applyDocumentDiscount(
    base.subtotal,
    base.taxTotal,
    taxExempt,
    kind,
    v,
  );
}

/** Remise ligne persistée (aligné backend). */
export function mockPersistLineDiscountFields(input: {
  lineDiscountKind?: string | null;
  lineDiscountValue?: number | null;
  lineDiscountLabel?: string | null;
}): {
  lineDiscountKind: string;
  lineDiscountValue: number;
  lineDiscountLabel: string | null;
} {
  const kind = normalizeDiscountKind(input.lineDiscountKind);
  const vr = input.lineDiscountValue ?? 0;
  const v = Number.isFinite(vr) ? Math.max(0, vr) : 0;
  if (kind === "none" || v <= 0) {
    return {
      lineDiscountKind: "none",
      lineDiscountValue: 0,
      lineDiscountLabel: null,
    };
  }
  const label =
    typeof input.lineDiscountLabel === "string" &&
    input.lineDiscountLabel.trim()
      ? input.lineDiscountLabel.trim()
      : null;
  return { lineDiscountKind: kind, lineDiscountValue: v, lineDiscountLabel: label };
}

/** Champs remise persistés (aligné backend). */
export function mockPersistDiscountFields(input: {
  discountKind?: string | null;
  discountValue?: number | null;
  discountLabel?: string | null;
}): {
  discountKind: string;
  discountValue: number;
  discountLabel: string | null;
} {
  const kind = normalizeDiscountKind(input.discountKind);
  const vr = input.discountValue ?? 0;
  const v = Number.isFinite(vr) ? Math.max(0, vr) : 0;
  if (kind === "none" || v <= 0) {
    return { discountKind: "none", discountValue: 0, discountLabel: null };
  }
  const label =
    typeof input.discountLabel === "string" && input.discountLabel.trim()
      ? input.discountLabel.trim()
      : null;
  return { discountKind: kind, discountValue: v, discountLabel: label };
}
