import { ipc } from "@/lib/apiCore";

export type QuoteLine = {
  id: string;
  quoteId: string;
  articleId: string | null;
  description: string;
  optionsSnapshotJson: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
  sortOrder: number;
  lineNote: string | null;
  showNoteOnQuote: boolean;
  /** unit | flat | hourly */
  billingMode: string;
  /** Remise sur le HT de la ligne (`none` | `percent` | `fixed`). */
  lineDiscountKind: string;
  lineDiscountValue: number;
  lineDiscountLabel: string | null;
};

export type QuoteComplement = {
  id: string;
  quoteId: string;
  sortOrder: number;
  snippetId: string | null;
  body: string;
};

export type Quote = {
  id: string;
  workspaceId: string;
  clientId: string | null;
  number: string;
  title: string;
  useCustomNumber: boolean;
  status: string;
  currency: string;
  taxExempt: boolean;
  issueDate: string;
  validUntil: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  /** `none` | `percent` | `fixed` — remise sur HT, TVA au prorata. */
  discountKind: string;
  discountValue: number;
  discountLabel: string | null;
  notes: string | null;
  /** Variante PDF ; `null` = défaut de l’espace (Paramètres → mise en page). */
  pdfTemplateVariant: string | null;
  /** Document retiré des listes Accueil ; visible dans Bases → Historique. */
  archived?: boolean;
  /** Projet rattaché (module Projets). */
  projectId?: string | null;
  lines: QuoteLine[];
  complements: QuoteComplement[];
};

export type QuoteInput = {
  title?: string;
  useCustomNumber?: boolean;
  customNumber?: string | null;
  clientId?: string | null;
  status: string;
  currency: string;
  taxExempt: boolean;
  issueDate: string;
  validUntil?: string | null;
  notes?: string | null;
  pdfTemplateVariant?: string | null;
  lines: {
    id?: string | null;
    articleId?: string | null;
    description: string;
    optionsSnapshotJson?: unknown;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    lineNote?: string | null;
    showNoteOnQuote?: boolean;
    billingMode?: string;
    lineDiscountKind?: string | null;
    lineDiscountValue?: number | null;
    lineDiscountLabel?: string | null;
  }[];
  complements?: {
    id?: string | null;
    snippetId?: string | null;
    body: string;
  }[];
  archived?: boolean;
  discountKind?: string | null;
  discountValue?: number | null;
  discountLabel?: string | null;
  projectId?: string | null;
};

export async function listQuotes(workspaceId: string): Promise<Quote[]> {
  return ipc("list_quotes", { workspaceId });
}

/** Prochain numéro auto `DEV-xxxxx` sans créer de devis (aperçu en-tête / PDF). */
export async function peekNextQuoteNumber(workspaceId: string): Promise<string> {
  return ipc("peek_next_quote_number", { workspaceId });
}

/** Prochain numéro auto `FAC-xxxxx` sans créer de facture. */
export async function peekNextInvoiceNumber(workspaceId: string): Promise<string> {
  return ipc("peek_next_invoice_number", { workspaceId });
}

export async function createQuote(
  workspaceId: string,
  input: QuoteInput,
): Promise<Quote> {
  return ipc("create_quote", { workspaceId, input });
}

export async function getQuote(id: string): Promise<Quote> {
  return ipc("get_quote", { id });
}

export async function updateQuote(
  id: string,
  input: QuoteInput,
): Promise<Quote> {
  return ipc("update_quote", { id, input });
}

export async function deleteQuote(id: string): Promise<void> {
  return ipc("delete_quote", { id });
}
