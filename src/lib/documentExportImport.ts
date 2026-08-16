import type {
  Invoice,
  InvoiceInput,
  Quote,
  QuoteInput,
} from "@/lib/api";

function optsFromStored(v: string): unknown {
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

export function quoteToImportInput(q: Quote): QuoteInput {
  return {
    title: q.title,
    useCustomNumber: q.useCustomNumber === true,
    customNumber: q.useCustomNumber === true ? q.number : null,
    clientId: q.clientId,
    status: q.status,
    currency: q.currency,
    taxExempt: q.taxExempt,
    issueDate: q.issueDate,
    validUntil: q.validUntil,
    notes: q.notes,
    pdfTemplateVariant: q.pdfTemplateVariant,
    archived: q.archived === true,
    discountKind: q.discountKind,
    discountValue: q.discountValue,
    discountLabel: q.discountLabel,
    lines: q.lines.map((l) => ({
      articleId: l.articleId,
      description: l.description,
      optionsSnapshotJson: optsFromStored(l.optionsSnapshotJson),
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineNote: l.lineNote,
      showNoteOnQuote: l.showNoteOnQuote === true,
      billingMode: l.billingMode,
      lineDiscountKind: l.lineDiscountKind,
      lineDiscountValue: l.lineDiscountValue,
      lineDiscountLabel: l.lineDiscountLabel,
    })),
    complements: q.complements.map((c) => ({
      snippetId: c.snippetId,
      body: c.body,
    })),
  };
}

export function invoiceToImportInput(inv: Invoice): InvoiceInput {
  return {
    useCustomNumber: inv.useCustomNumber === true,
    customNumber: inv.useCustomNumber === true ? inv.number : null,
    clientId: inv.clientId,
    quoteId: null,
    status: inv.status,
    currency: inv.currency,
    taxExempt: inv.taxExempt,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    amountPaid: inv.amountPaid,
    notes: inv.notes,
    pdfTemplateVariant: inv.pdfTemplateVariant,
    archived: inv.archived === true,
    discountKind: inv.discountKind,
    discountValue: inv.discountValue,
    discountLabel: inv.discountLabel,
    lines: inv.lines.map((l) => ({
      articleId: l.articleId,
      description: l.description,
      optionsSnapshotJson: optsFromStored(l.optionsSnapshotJson),
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineNote: l.lineNote,
      showNoteOnInvoice: l.showNoteOnInvoice === true,
      billingMode: l.billingMode,
      lineDiscountKind: l.lineDiscountKind,
      lineDiscountValue: l.lineDiscountValue,
      lineDiscountLabel: l.lineDiscountLabel,
    })),
    complements: inv.complements.map((c) => ({
      snippetId: c.snippetId,
      body: c.body,
    })),
  };
}
