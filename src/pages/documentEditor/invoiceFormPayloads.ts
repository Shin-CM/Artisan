import type * as api from "@/lib/api";
import type { EditableComplement } from "@/components/DocumentComplementsEditor";
import {
  applyDocumentDiscount,
  sumDocumentLines,
} from "@/core/documentMath";
import type { DocumentLineMathInput } from "@/pages/documentEditor/documentDiscountTotals";
import type { InvoiceEditableLine } from "@/pages/documentEditor/editableLineTypes";
import {
  lineDiscountInputFromEditor,
  lineDiscountRowFromEditor,
} from "@/pages/documentEditor/lineDiscountPayload";

function optionsFromSnapshotJson(snapshot: string): unknown {
  try {
    return JSON.parse(snapshot || "{}");
  } catch {
    return {};
  }
}

export type BuildInvoiceInputParams = {
  documentKind?: "invoice" | "credit_note";
  creditedInvoiceId?: string | null;
  baseCurrency: string;
  refCustomEnabled: boolean;
  refText: string;
  clientId: string;
  quoteId: string | null;
  status: string;
  taxExempt: boolean;
  issueDateYmd: string;
  dueDateYmd: string;
  amountPaid: number;
  notes: string;
  pdfTemplateVariant: string;
  archived: boolean;
  lines: InvoiceEditableLine[];
  complements: EditableComplement[];
  discKindNorm: "none" | "percent" | "fixed";
  discValSafe: number;
  discountLabel: string;
  projectId?: string | null;
};

export function buildInvoiceInput(p: BuildInvoiceInputParams): api.InvoiceInput {
  const dk = p.documentKind ?? "invoice";
  const credited =
    dk === "credit_note" && p.creditedInvoiceId?.trim()
      ? p.creditedInvoiceId.trim()
      : null;
  return {
    documentKind: dk,
    creditedInvoiceId: credited,
    useCustomNumber: p.refCustomEnabled,
    customNumber: p.refCustomEnabled ? p.refText.trim() : null,
    clientId: p.clientId || null,
    quoteId: p.quoteId,
    status: p.status,
    currency: p.baseCurrency,
    taxExempt: p.taxExempt,
    issueDate: new Date(p.issueDateYmd).toISOString(),
    dueDate: p.dueDateYmd ? new Date(p.dueDateYmd).toISOString() : null,
    amountPaid: p.amountPaid,
    notes: p.notes || null,
    pdfTemplateVariant: p.pdfTemplateVariant.trim() || null,
    archived: p.archived,
    lines: p.lines.map((l) => ({
      id: l.id,
      articleId: l.articleId,
      description: l.description,
      optionsSnapshotJson: optionsFromSnapshotJson(l.optionsSnapshotJson),
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineNote: l.lineNote.trim() || null,
      showNoteOnInvoice: l.showNoteOnInvoice,
      billingMode: l.billingMode,
      ...lineDiscountInputFromEditor(l),
    })),
    complements: p.complements.map((c) => ({
      id: c.id,
      snippetId: c.snippetId,
      body: c.body,
    })),
    discountKind: p.discKindNorm === "none" ? null : p.discKindNorm,
    discountValue: p.discValSafe,
    discountLabel: p.discountLabel.trim() || null,
    projectId: p.projectId?.trim() ? p.projectId.trim() : null,
  };
}

export type BuildInvoiceForPdfParams = {
  documentKind?: "invoice" | "credit_note";
  creditedInvoiceId?: string | null;
  workspaceId: string;
  invoiceId: string | undefined;
  quoteId: string | null;
  invoiceNumber: string;
  refCustomForPdf: boolean;
  invoiceArchived: boolean;
  clientId: string | null;
  status: string;
  currency: string;
  taxExempt: boolean;
  issueDateYmd: string;
  dueDateYmd: string;
  amountPaid: number;
  notes: string;
  pdfTemplateVariant: string;
  lines: InvoiceEditableLine[];
  lineInputs: DocumentLineMathInput[];
  complements: EditableComplement[];
  discKindNorm: "none" | "percent" | "fixed";
  discValSafe: number;
  discountLabel: string;
  projectId?: string | null;
};

export function buildInvoiceForPdf(p: BuildInvoiceForPdfParams): api.Invoice {
  const { details, subtotal: gSub, taxTotal: gTax } = sumDocumentLines(
    p.lineInputs,
    p.taxExempt,
  );
  const { subtotal, taxTotal, total } = applyDocumentDiscount(
    gSub,
    gTax,
    p.taxExempt,
    p.discKindNorm,
    p.discValSafe,
  );
  const draftId = p.invoiceId ?? "draft";
  const invLines: api.InvoiceLine[] = p.lines.map((l, i) => ({
    id: l.id ?? `tmp-line-${i}`,
    invoiceId: draftId,
    articleId: l.articleId,
    description: l.description,
    optionsSnapshotJson: l.optionsSnapshotJson || "{}",
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRate: l.taxRate,
    lineSubtotal: details[i]!.lineSubtotal,
    lineTax: details[i]!.lineTax,
    lineTotal: details[i]!.lineTotal,
    sortOrder: i,
    lineNote: l.lineNote.trim() || null,
    showNoteOnInvoice: l.showNoteOnInvoice,
    billingMode: l.billingMode,
    ...lineDiscountRowFromEditor(l),
  }));
  const dk = p.documentKind ?? "invoice";
  return {
    id: draftId,
    workspaceId: p.workspaceId,
    clientId: p.clientId,
    quoteId: p.quoteId,
    documentKind: dk,
    creditedInvoiceId:
      dk === "credit_note" && p.creditedInvoiceId?.trim()
        ? p.creditedInvoiceId.trim()
        : null,
    number: p.invoiceNumber,
    useCustomNumber: p.refCustomForPdf,
    status: p.status,
    currency: p.currency,
    taxExempt: p.taxExempt,
    issueDate: new Date(p.issueDateYmd).toISOString(),
    dueDate: p.dueDateYmd ? new Date(p.dueDateYmd).toISOString() : null,
    subtotal,
    taxTotal,
    total,
    amountPaid: p.amountPaid,
    discountKind: p.discKindNorm,
    discountValue: p.discValSafe,
    discountLabel: p.discountLabel.trim() || null,
    notes: p.notes || null,
    pdfTemplateVariant: p.pdfTemplateVariant.trim() || null,
    archived: p.invoiceArchived,
    lines: invLines,
    complements: p.complements.map((c, i) => ({
      id: c.id ?? `c-${i}`,
      invoiceId: draftId,
      sortOrder: i,
      snippetId: c.snippetId,
      body: c.body,
    })),
    projectId: p.projectId?.trim() ? p.projectId.trim() : null,
  };
}
