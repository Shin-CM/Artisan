import type * as api from "@/lib/api";
import type { EditableComplement } from "@/components/DocumentComplementsEditor";
import {
  applyDocumentDiscount,
  sumDocumentLines,
} from "@/core/documentMath";
import type { DocumentLineMathInput } from "@/pages/documentEditor/documentDiscountTotals";
import type { QuoteEditableLine } from "@/pages/documentEditor/editableLineTypes";
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

function validUntilIsoFromYmd(ymd: string): string | null {
  const t = ymd.trim();
  if (!t) return null;
  return new Date(t).toISOString();
}

/** Met à jour un devis depuis la liste (sidebar) sans ouvrir le formulaire. */
export function quoteToUpdateInput(
  q: api.Quote,
  archived: boolean,
): api.QuoteInput {
  return {
    title: q.title?.trim() ?? "",
    useCustomNumber: q.useCustomNumber,
    customNumber: q.useCustomNumber ? q.number : null,
    clientId: q.clientId,
    status: q.status,
    currency: q.currency,
    taxExempt: q.taxExempt,
    issueDate: q.issueDate,
    validUntil: q.validUntil,
    notes: q.notes,
    pdfTemplateVariant: q.pdfTemplateVariant,
    archived,
    lines: q.lines.map((l) => ({
      id: l.id,
      articleId: l.articleId,
      description: l.description,
      optionsSnapshotJson: optionsFromSnapshotJson(l.optionsSnapshotJson || "{}"),
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineNote: l.lineNote?.trim() || null,
      showNoteOnQuote: l.showNoteOnQuote,
      billingMode: l.billingMode,
      lineDiscountKind: l.lineDiscountKind,
      lineDiscountValue: l.lineDiscountValue,
      lineDiscountLabel: l.lineDiscountLabel,
    })),
    complements: q.complements.map((c) => ({
      id: c.id,
      snippetId: c.snippetId,
      body: c.body,
    })),
    discountKind: q.discountKind,
    discountValue: q.discountValue,
    discountLabel: q.discountLabel,
    projectId: q.projectId ?? null,
  };
}

export type BuildQuoteInputParams = {
  baseCurrency: string;
  docTitle: string;
  refCustomEnabled: boolean;
  refText: string;
  clientId: string;
  status: string;
  taxExempt: boolean;
  issueDateYmd: string;
  /** Vide = pas de date limite (PDF sans ligne « Valable jusqu’au »). */
  validUntilYmd: string;
  notes: string;
  pdfTemplateVariant: string;
  archived: boolean;
  lines: QuoteEditableLine[];
  complements: EditableComplement[];
  discKindNorm: "none" | "percent" | "fixed";
  discValSafe: number;
  discountLabel: string;
  projectId?: string | null;
};

export function buildQuoteInput(p: BuildQuoteInputParams): api.QuoteInput {
  return {
    title: p.docTitle.trim(),
    useCustomNumber: p.refCustomEnabled,
    customNumber: p.refCustomEnabled ? p.refText.trim() : null,
    clientId: p.clientId || null,
    status: p.status,
    currency: p.baseCurrency,
    taxExempt: p.taxExempt,
    issueDate: new Date(p.issueDateYmd).toISOString(),
    validUntil: validUntilIsoFromYmd(p.validUntilYmd),
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
      showNoteOnQuote: l.showNoteOnQuote,
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

export type BuildQuoteForPdfParams = {
  workspaceId: string;
  quoteId: string | undefined;
  quoteNumber: string;
  quoteArchived: boolean;
  clientId: string | null;
  docTitle: string;
  refCustomEnabled: boolean;
  status: string;
  currency: string;
  taxExempt: boolean;
  issueDateYmd: string;
  /** Vide = pas de date limite sur le PDF. */
  validUntilYmd: string;
  notes: string;
  pdfTemplateVariant: string;
  lines: QuoteEditableLine[];
  lineInputs: DocumentLineMathInput[];
  complements: EditableComplement[];
  discKindNorm: "none" | "percent" | "fixed";
  discValSafe: number;
  discountLabel: string;
  projectId?: string | null;
};

export function buildQuoteForPdf(p: BuildQuoteForPdfParams): api.Quote {
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
  const draftId = p.quoteId ?? "draft";
  const quoteLines: api.QuoteLine[] = p.lines.map((l, i) => ({
    id: l.id ?? `tmp-line-${i}`,
    quoteId: draftId,
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
    showNoteOnQuote: l.showNoteOnQuote,
    billingMode: l.billingMode,
    ...lineDiscountRowFromEditor(l),
  }));
  return {
    id: draftId,
    workspaceId: p.workspaceId,
    clientId: p.clientId,
    number: p.quoteNumber,
    title: p.docTitle.trim(),
    useCustomNumber: p.refCustomEnabled,
    status: p.status,
    currency: p.currency,
    taxExempt: p.taxExempt,
    issueDate: new Date(p.issueDateYmd).toISOString(),
    validUntil: validUntilIsoFromYmd(p.validUntilYmd),
    subtotal,
    taxTotal,
    total,
    discountKind: p.discKindNorm,
    discountValue: p.discValSafe,
    discountLabel: p.discountLabel.trim() || null,
    notes: p.notes || null,
    pdfTemplateVariant: p.pdfTemplateVariant.trim() || null,
    archived: p.quoteArchived,
    lines: quoteLines,
    complements: p.complements.map((c, i) => ({
      id: c.id ?? `c-${i}`,
      quoteId: draftId,
      sortOrder: i,
      snippetId: c.snippetId,
      body: c.body,
    })),
    projectId: p.projectId?.trim() ? p.projectId.trim() : null,
  };
}
