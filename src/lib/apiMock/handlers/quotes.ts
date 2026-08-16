import type { Quote, QuoteInput } from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import {
  buildQuoteComplements,
  buildQuoteLines,
  mockPersistDiscountFields,
  quoteTotalsWithDiscount,
} from "@/lib/apiMock/documentBuilders";
import { ensureProjectWorkspace } from "@/lib/apiMock/handlers/projects";
import {
  nextQuoteNumber,
  peekNextQuoteNumber,
  quoteNumberTaken,
  rid,
  store,
} from "@/lib/apiMock/store";

export const quoteHandlers: Record<string, MockHandler> = {
  peek_next_quote_number: (args) => {
    const workspaceId = args.workspaceId as string;
    return peekNextQuoteNumber(workspaceId);
  },

  list_quotes: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.quotes
      .filter((q) => q.workspaceId === workspaceId)
      .sort((a, b) => {
        const d = b.issueDate.localeCompare(a.issueDate);
        if (d !== 0) return d;
        return b.id.localeCompare(a.id);
      });
  },

  get_quote: (args) => {
    const id = args.id as string;
    const q = store.quotes.find((x) => x.id === id);
    if (!q) throw new Error("Devis introuvable");
    return q;
  },

  create_quote: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as QuoteInput;
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
      if (!s) throw new Error("Indiquez une référence de devis.");
      if (quoteNumberTaken(workspaceId, s)) {
        throw new Error(
          `La référence « ${s} » est déjà utilisée pour un autre devis dans cet espace.`,
        );
      }
      number = s;
      useCustomNumber = true;
    } else {
      number = nextQuoteNumber(workspaceId);
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
    store.quotes.push(q);
    return q;
  },

  update_quote: (args) => {
    const id = args.id as string;
    const input = args.input as QuoteInput;
    const q = store.quotes.find((x) => x.id === id);
    if (!q) throw new Error("Devis introuvable");
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
      if (!s) throw new Error("Indiquez une référence de devis.");
      if (s !== oldNumber && quoteNumberTaken(q.workspaceId, s, id)) {
        throw new Error(
          `La référence « ${s} » est déjà utilisée pour un autre devis dans cet espace.`,
        );
      }
      newNumber = s;
      newUseCustom = true;
    } else if (wasCustom) {
      newNumber = nextQuoteNumber(q.workspaceId);
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

  delete_quote: (args) => {
    const id = args.id as string;
    store.quotes = store.quotes.filter((q) => q.id !== id);
    return undefined;
  },
};
