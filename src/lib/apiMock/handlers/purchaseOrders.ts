import type { Quote, QuoteInput } from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { ensureProjectWorkspace } from "@/lib/apiMock/handlers/projects";
import {
  buildQuoteComplements,
  buildQuoteLines,
  mockPersistDiscountFields,
  quoteTotalsWithDiscount,
} from "@/lib/apiMock/documentBuilders";
import {
  nextPurchaseOrderNumber,
  peekNextPurchaseOrderNumber,
  purchaseOrderNumberTaken,
  rid,
  store,
} from "@/lib/apiMock/store";

function mockInsertPurchaseOrder(workspaceId: string, input: QuoteInput): Quote {
  ensureProjectWorkspace(workspaceId, input.projectId);
  const qid = rid();
  const lines = buildQuoteLines(qid, input, input.taxExempt);
  const disc = mockPersistDiscountFields(input);
  const { subtotal, taxTotal, total } = quoteTotalsWithDiscount(
    lines,
    input.taxExempt,
    disc.discountKind,
    disc.discountValue,
  );
  const title = (input.title ?? "").trim();
  const useC = input.useCustomNumber === true;
  let number: string;
  let useCustomNumber: boolean;
  if (useC) {
    const s = (input.customNumber ?? "").trim();
    if (!s) throw new Error("Indiquez une référence de bon de commande.");
    if (purchaseOrderNumberTaken(workspaceId, s)) {
      throw new Error(
        `La référence « ${s} » est déjà utilisée pour un autre bon de commande dans cet espace.`,
      );
    }
    number = s;
    useCustomNumber = true;
  } else {
    number = nextPurchaseOrderNumber(workspaceId);
    useCustomNumber = false;
  }
  const q: Quote = {
    id: qid,
    workspaceId,
    clientId: input.clientId ?? null,
    number,
    title,
    useCustomNumber,
    status: input.status,
    currency: input.currency,
    taxExempt: input.taxExempt,
    issueDate: input.issueDate,
    validUntil: input.validUntil ?? null,
    subtotal,
    taxTotal,
    total,
    discountKind: disc.discountKind,
    discountValue: disc.discountValue,
    discountLabel: disc.discountLabel,
    notes: input.notes ?? null,
    pdfTemplateVariant: input.pdfTemplateVariant ?? null,
    archived: input.archived === true,
    projectId: input.projectId?.trim() || null,
    lines,
    complements: buildQuoteComplements(qid, input),
  };
  store.purchaseOrders.push(q);
  return q;
}

export const purchaseOrderHandlers: Record<string, MockHandler> = {
  peek_next_purchase_order_number: (args) => {
    const workspaceId = args.workspaceId as string;
    return peekNextPurchaseOrderNumber(workspaceId);
  },

  list_purchase_orders: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.purchaseOrders
      .filter((q) => q.workspaceId === workspaceId)
      .sort((a, b) => {
        const d = b.issueDate.localeCompare(a.issueDate);
        if (d !== 0) return d;
        return b.id.localeCompare(a.id);
      });
  },

  get_purchase_order: (args) => {
    const id = args.id as string;
    const q = store.purchaseOrders.find((x) => x.id === id);
    if (!q) throw new Error("Bon de commande introuvable");
    return q;
  },

  create_purchase_order: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as QuoteInput;
    return mockInsertPurchaseOrder(workspaceId, input);
  },

  convert_quote_to_purchase_order: (args) => {
    const quoteId = args.quoteId as string;
    const workspaceId = args.workspaceId as string;
    const q = store.quotes.find((x) => x.id === quoteId);
    if (!q || q.workspaceId !== workspaceId) {
      throw new Error("Devis introuvable");
    }
    const input: QuoteInput = {
      title: q.title,
      useCustomNumber: false,
      clientId: q.clientId,
      status: "draft",
      currency: q.currency,
      taxExempt: q.taxExempt,
      issueDate: new Date().toISOString().slice(0, 10),
      validUntil: q.validUntil ?? null,
      notes: q.notes ?? null,
      pdfTemplateVariant: q.pdfTemplateVariant ?? null,
      archived: false,
      lines: q.lines.map((l) => {
        let snap: unknown = {};
        try {
          snap = JSON.parse(l.optionsSnapshotJson || "{}");
        } catch {
          snap = {};
        }
        return {
          articleId: l.articleId,
          description: l.description,
          optionsSnapshotJson: snap,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          lineNote: l.lineNote,
          showNoteOnQuote: l.showNoteOnQuote,
          billingMode: l.billingMode,
          lineDiscountKind: l.lineDiscountKind,
          lineDiscountValue: l.lineDiscountValue,
          lineDiscountLabel: l.lineDiscountLabel,
        };
      }),
      complements: (q.complements ?? []).map((c) => ({
        snippetId: c.snippetId,
        body: c.body,
      })),
      discountKind: q.discountKind,
      discountValue: q.discountValue,
      discountLabel: q.discountLabel,
      projectId: q.projectId ?? null,
    };
    return mockInsertPurchaseOrder(workspaceId, input);
  },

  update_purchase_order: (args) => {
    const id = args.id as string;
    const input = args.input as QuoteInput;
    const q = store.purchaseOrders.find((x) => x.id === id);
    if (!q) throw new Error("Bon de commande introuvable");
    ensureProjectWorkspace(q.workspaceId, input.projectId);
    const lines = buildQuoteLines(id, input, input.taxExempt);
    const disc = mockPersistDiscountFields(input);
    const { subtotal, taxTotal, total } = quoteTotalsWithDiscount(
      lines,
      input.taxExempt,
      disc.discountKind,
      disc.discountValue,
    );
    const title = (input.title ?? "").trim();
    const useC = input.useCustomNumber === true;
    const wasCustom = q.useCustomNumber;
    const oldNumber = q.number;
    let newNumber: string;
    let newUseCustom: boolean;
    if (useC) {
      const s = (input.customNumber ?? "").trim();
      if (!s) throw new Error("Indiquez une référence de bon de commande.");
      if (s !== oldNumber && purchaseOrderNumberTaken(q.workspaceId, s, id)) {
        throw new Error(
          `La référence « ${s} » est déjà utilisée pour un autre bon de commande dans cet espace.`,
        );
      }
      newNumber = s;
      newUseCustom = true;
    } else if (wasCustom) {
      newNumber = nextPurchaseOrderNumber(q.workspaceId);
      newUseCustom = false;
    } else {
      newNumber = oldNumber;
      newUseCustom = false;
    }
    q.title = title;
    q.number = newNumber;
    q.useCustomNumber = newUseCustom;
    q.clientId = input.clientId ?? null;
    q.status = input.status;
    q.currency = input.currency;
    q.taxExempt = input.taxExempt;
    q.issueDate = input.issueDate;
    q.validUntil = input.validUntil ?? null;
    q.notes = input.notes ?? null;
    q.lines = lines;
    q.subtotal = subtotal;
    q.taxTotal = taxTotal;
    q.total = total;
    q.discountKind = disc.discountKind;
    q.discountValue = disc.discountValue;
    q.discountLabel = disc.discountLabel;
    q.complements = buildQuoteComplements(id, input);
    q.pdfTemplateVariant = input.pdfTemplateVariant ?? null;
    q.archived = input.archived === true;
    q.projectId = input.projectId?.trim() || null;
    return q;
  },

  delete_purchase_order: (args) => {
    const id = args.id as string;
    store.purchaseOrders = store.purchaseOrders.filter((q) => q.id !== id);
    return undefined;
  },
};
