import type {
  Invoice,
  InvoiceComplement,
  InvoiceInput,
  InvoiceLine,
} from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { ensureProjectWorkspace } from "@/lib/apiMock/handlers/projects";
import {
  buildInvoiceComplements,
  buildInvoiceLines,
  invoiceTotalsWithDiscount,
  mockPersistDiscountFields,
} from "@/lib/apiMock/documentBuilders";
import {
  issuedInvoiceContentLocked,
  parseInvoiceWorkspacePreferences,
} from "@/lib/documentOptions";
import { normalizeLineBillingMode } from "@/lib/lineBilling";
import {
  invoiceNumberTaken,
  nextCreditNoteNumber,
  nextInvoiceNumber,
  peekNextCreditNoteNumber,
  peekNextInvoiceNumber,
  rid,
  store,
} from "@/lib/apiMock/store";

export const invoiceHandlers: Record<string, MockHandler> = {
  peek_next_invoice_number: (args) => {
    const workspaceId = args.workspaceId as string;
    return peekNextInvoiceNumber(workspaceId);
  },

  list_invoices: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.invoices.filter(
      (i) =>
        i.workspaceId === workspaceId &&
        (i.documentKind ?? "invoice") === "invoice",
    );
  },

  list_credit_notes: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.invoices.filter(
      (i) =>
        i.workspaceId === workspaceId &&
        (i.documentKind ?? "invoice") === "credit_note",
    );
  },

  peek_next_credit_note_number: (args) => {
    const workspaceId = args.workspaceId as string;
    return peekNextCreditNoteNumber(workspaceId);
  },

  get_invoice: (args) => {
    const id = args.id as string;
    const inv = store.invoices.find((x) => x.id === id);
    if (!inv) throw new Error("Facture introuvable");
    return inv;
  },

  create_invoice: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as InvoiceInput;
    ensureProjectWorkspace(workspaceId, input.projectId);
    const dk = input.documentKind === "credit_note" ? "credit_note" : "invoice";
    const iid = rid();
    const lines = buildInvoiceLines(iid, input, input.taxExempt);
    const disc = mockPersistDiscountFields(input);
    const { subtotal, taxTotal, total } = invoiceTotalsWithDiscount(
      lines,
      input.taxExempt,
      disc.discountKind,
      disc.discountValue,
    );
    const useC = input.useCustomNumber === true;
    let number: string;
    let useCustomNumber: boolean;
    const refLabel = dk === "credit_note" ? "avoir" : "facture";
    if (useC) {
      const s = (input.customNumber ?? "").trim();
      if (!s) throw new Error(`Indiquez une référence de ${refLabel}.`);
      if (invoiceNumberTaken(workspaceId, s)) {
        throw new Error(
          `La référence « ${s} » est déjà utilisée pour un autre document dans cet espace.`,
        );
      }
      number = s;
      useCustomNumber = true;
    } else {
      number =
        dk === "credit_note"
          ? nextCreditNoteNumber(workspaceId)
          : nextInvoiceNumber(workspaceId);
      useCustomNumber = false;
    }
    const credited =
      dk === "credit_note" && input.creditedInvoiceId?.trim()
        ? input.creditedInvoiceId.trim()
        : null;
    const inv: Invoice = {
      id: iid,
      workspaceId,
      clientId: input.clientId ?? null,
      quoteId: input.quoteId ?? null,
      documentKind: dk,
      creditedInvoiceId: credited,
      number,
      useCustomNumber,
      status: input.status,
      currency: input.currency,
      taxExempt: input.taxExempt,
      issueDate: input.issueDate,
      dueDate: input.dueDate ?? null,
      subtotal,
      taxTotal,
      total,
      amountPaid: input.amountPaid,
      discountKind: disc.discountKind,
      discountValue: disc.discountValue,
      discountLabel: disc.discountLabel,
      notes: input.notes ?? null,
      pdfTemplateVariant: input.pdfTemplateVariant ?? null,
      archived: input.archived === true,
      projectId: input.projectId?.trim() || null,
      lines,
      complements: buildInvoiceComplements(iid, input),
    };
    store.invoices.push(inv);
    return inv;
  },

  update_invoice: (args) => {
    const id = args.id as string;
    const input = args.input as InvoiceInput;
    const inv = store.invoices.find((x) => x.id === id);
    if (!inv) throw new Error("Facture introuvable");
    const ws = store.workspaces.find((w) => w.id === inv.workspaceId);
    const lockPrefs = parseInvoiceWorkspacePreferences(ws?.profileJson ?? "{}");
    if (issuedInvoiceContentLocked(inv, lockPrefs)) {
      if (input.status.trim() === "draft") {
        throw new Error(
          "Impossible de repasser une facture verrouillée en brouillon.",
        );
      }
      inv.status = input.status;
      inv.amountPaid = input.amountPaid;
      inv.archived = input.archived === true;
      return inv;
    }
    ensureProjectWorkspace(inv.workspaceId, input.projectId);
    const lines = buildInvoiceLines(id, input, input.taxExempt);
    const disc = mockPersistDiscountFields(input);
    const { subtotal, taxTotal, total } = invoiceTotalsWithDiscount(
      lines,
      input.taxExempt,
      disc.discountKind,
      disc.discountValue,
    );
    const useC = input.useCustomNumber === true;
    const wasCustom = inv.useCustomNumber === true;
    const oldNumber = inv.number;
    let newNumber: string;
    let newUseCustom: boolean;
    const dk = inv.documentKind ?? "invoice";
    const refLabel = dk === "credit_note" ? "avoir" : "facture";
    if (useC) {
      const s = (input.customNumber ?? "").trim();
      if (!s) throw new Error(`Indiquez une référence de ${refLabel}.`);
      if (s !== oldNumber && invoiceNumberTaken(inv.workspaceId, s, id)) {
        throw new Error(
          `La référence « ${s} » est déjà utilisée pour un autre document dans cet espace.`,
        );
      }
      newNumber = s;
      newUseCustom = true;
    } else if (wasCustom) {
      newNumber =
        dk === "credit_note"
          ? nextCreditNoteNumber(inv.workspaceId)
          : nextInvoiceNumber(inv.workspaceId);
      newUseCustom = false;
    } else {
      newNumber = oldNumber;
      newUseCustom = false;
    }
    inv.number = newNumber;
    inv.useCustomNumber = newUseCustom;
    inv.clientId = input.clientId ?? null;
    inv.quoteId = input.quoteId ?? null;
    inv.status = input.status;
    inv.currency = input.currency;
    inv.taxExempt = input.taxExempt;
    inv.issueDate = input.issueDate;
    inv.dueDate = input.dueDate ?? null;
    inv.amountPaid = input.amountPaid;
    inv.notes = input.notes ?? null;
    inv.lines = lines;
    inv.subtotal = subtotal;
    inv.taxTotal = taxTotal;
    inv.total = total;
    inv.discountKind = disc.discountKind;
    inv.discountValue = disc.discountValue;
    inv.discountLabel = disc.discountLabel;
    inv.complements = buildInvoiceComplements(id, input);
    inv.pdfTemplateVariant = input.pdfTemplateVariant ?? null;
    inv.archived = input.archived === true;
    inv.projectId = input.projectId?.trim() || null;
    if (dk === "credit_note") {
      inv.creditedInvoiceId =
        input.creditedInvoiceId?.trim() || null;
    } else {
      inv.creditedInvoiceId = null;
    }
    return inv;
  },

  delete_invoice: (args) => {
    const id = args.id as string;
    const inv = store.invoices.find((i) => i.id === id);
    if (inv) {
      const ws = store.workspaces.find((w) => w.id === inv.workspaceId);
      const lockPrefs = parseInvoiceWorkspacePreferences(
        ws?.profileJson ?? "{}",
      );
      if (issuedInvoiceContentLocked(inv, lockPrefs)) {
        throw new Error(
          "Impossible de supprimer une facture verrouillée. Archivez-la, créez un avoir, ou désactivez le verrouillage dans Paramètres → Espace de travail.",
        );
      }
    }
    store.invoices = store.invoices.filter((i) => i.id !== id);
    return undefined;
  },

  convert_quote_to_invoice: (args) => {
    const quoteId = args.quoteId as string;
    const workspaceId = args.workspaceId as string;
    const q = store.quotes.find((x) => x.id === quoteId);
    if (!q || q.workspaceId !== workspaceId)
      throw new Error("Devis introuvable");
    const iid = rid();
    const lines: InvoiceLine[] = q.lines.map((l, i) => ({
      id: rid(),
      invoiceId: iid,
      articleId: l.articleId,
      description: l.description,
      optionsSnapshotJson: l.optionsSnapshotJson,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineSubtotal: l.lineSubtotal,
      lineTax: l.lineTax,
      lineTotal: l.lineTotal,
      sortOrder: i,
      lineNote: l.lineNote ?? null,
      showNoteOnInvoice: l.showNoteOnQuote === true,
      billingMode: normalizeLineBillingMode(l.billingMode),
      lineDiscountKind: l.lineDiscountKind,
      lineDiscountValue: l.lineDiscountValue,
      lineDiscountLabel: l.lineDiscountLabel,
    }));
    const compRaw = q.complements ?? [];
    const complements: InvoiceComplement[] = compRaw.map((c, i) => ({
      id: rid(),
      invoiceId: iid,
      sortOrder: i,
      snippetId: c.snippetId,
      body: c.body,
    }));
    const inv: Invoice = {
      id: iid,
      workspaceId,
      clientId: q.clientId,
      quoteId: q.id,
      documentKind: "invoice",
      creditedInvoiceId: null,
      number: nextInvoiceNumber(workspaceId),
      useCustomNumber: false,
      status: "draft",
      currency: q.currency,
      taxExempt: q.taxExempt,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: null,
      subtotal: q.subtotal,
      taxTotal: q.taxTotal,
      total: q.total,
      amountPaid: 0,
      discountKind: q.discountKind ?? "none",
      discountValue: q.discountValue ?? 0,
      discountLabel: q.discountLabel ?? null,
      notes: q.notes,
      pdfTemplateVariant: q.pdfTemplateVariant ?? null,
      archived: false,
      projectId: q.projectId ?? null,
      lines,
      complements,
    };
    store.invoices.push(inv);
    return inv;
  },

  convert_purchase_order_to_invoice: (args) => {
    const purchaseOrderId = args.purchaseOrderId as string;
    const workspaceId = args.workspaceId as string;
    const q = store.purchaseOrders.find((x) => x.id === purchaseOrderId);
    if (!q || q.workspaceId !== workspaceId)
      throw new Error("Bon de commande introuvable");
    const iid = rid();
    const lines: InvoiceLine[] = q.lines.map((l, i) => ({
      id: rid(),
      invoiceId: iid,
      articleId: l.articleId,
      description: l.description,
      optionsSnapshotJson: l.optionsSnapshotJson,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      lineSubtotal: l.lineSubtotal,
      lineTax: l.lineTax,
      lineTotal: l.lineTotal,
      sortOrder: i,
      lineNote: l.lineNote ?? null,
      showNoteOnInvoice: l.showNoteOnQuote === true,
      billingMode: normalizeLineBillingMode(l.billingMode),
      lineDiscountKind: l.lineDiscountKind,
      lineDiscountValue: l.lineDiscountValue,
      lineDiscountLabel: l.lineDiscountLabel,
    }));
    const compRaw = q.complements ?? [];
    const complements: InvoiceComplement[] = compRaw.map((c, i) => ({
      id: rid(),
      invoiceId: iid,
      sortOrder: i,
      snippetId: c.snippetId,
      body: c.body,
    }));
    const inv: Invoice = {
      id: iid,
      workspaceId,
      clientId: q.clientId,
      quoteId: null,
      documentKind: "invoice",
      creditedInvoiceId: null,
      number: nextInvoiceNumber(workspaceId),
      useCustomNumber: false,
      status: "draft",
      currency: q.currency,
      taxExempt: q.taxExempt,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: null,
      subtotal: q.subtotal,
      taxTotal: q.taxTotal,
      total: q.total,
      amountPaid: 0,
      discountKind: q.discountKind ?? "none",
      discountValue: q.discountValue ?? 0,
      discountLabel: q.discountLabel ?? null,
      notes: q.notes,
      pdfTemplateVariant: q.pdfTemplateVariant ?? null,
      archived: false,
      projectId: q.projectId ?? null,
      lines,
      complements,
    };
    store.invoices.push(inv);
    return inv;
  },
};
