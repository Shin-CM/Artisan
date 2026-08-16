import { ipc } from "@/lib/apiCore";

export type InvoiceLine = {
  id: string;
  invoiceId: string;
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
  showNoteOnInvoice: boolean;
  billingMode: string;
  lineDiscountKind: string;
  lineDiscountValue: number;
  lineDiscountLabel: string | null;
};

export type InvoiceComplement = {
  id: string;
  invoiceId: string;
  sortOrder: number;
  snippetId: string | null;
  body: string;
};

export type Invoice = {
  id: string;
  workspaceId: string;
  clientId: string | null;
  quoteId: string | null;
  number: string;
  /** `invoice` | `credit_note` — défaut facture classique. */
  documentKind?: string;
  /** Facture d’origine (optionnel) pour un avoir. */
  creditedInvoiceId?: string | null;
  /** Référence libre (vs numérotation FAC-xxxxx automatique). */
  useCustomNumber?: boolean;
  status: string;
  currency: string;
  taxExempt: boolean;
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  /** `none` | `percent` | `fixed` */
  discountKind: string;
  discountValue: number;
  discountLabel: string | null;
  notes: string | null;
  pdfTemplateVariant: string | null;
  /** Document retiré des listes Accueil ; visible dans Bases → Historique. */
  archived?: boolean;
  projectId?: string | null;
  lines: InvoiceLine[];
  complements: InvoiceComplement[];
};

export type InvoiceInput = {
  documentKind?: string;
  creditedInvoiceId?: string | null;
  useCustomNumber?: boolean;
  customNumber?: string | null;
  clientId?: string | null;
  quoteId?: string | null;
  status: string;
  currency: string;
  taxExempt: boolean;
  issueDate: string;
  dueDate?: string | null;
  amountPaid: number;
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
    showNoteOnInvoice?: boolean;
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

export async function listInvoices(workspaceId: string): Promise<Invoice[]> {
  return ipc("list_invoices", { workspaceId });
}

export async function listCreditNotes(workspaceId: string): Promise<Invoice[]> {
  return ipc("list_credit_notes", { workspaceId });
}

export async function createInvoice(
  workspaceId: string,
  input: InvoiceInput,
): Promise<Invoice> {
  return ipc("create_invoice", { workspaceId, input });
}

export async function getInvoice(id: string): Promise<Invoice> {
  return ipc("get_invoice", { id });
}

export async function updateInvoice(
  id: string,
  input: InvoiceInput,
): Promise<Invoice> {
  return ipc("update_invoice", { id, input });
}

export async function deleteInvoice(id: string): Promise<void> {
  return ipc("delete_invoice", { id });
}

export async function convertQuoteToInvoice(
  quoteId: string,
  workspaceId: string,
): Promise<Invoice> {
  return ipc("convert_quote_to_invoice", { quoteId, workspaceId });
}

export async function peekNextCreditNoteNumber(
  workspaceId: string,
): Promise<string> {
  return ipc("peek_next_credit_note_number", { workspaceId });
}

export async function convertPurchaseOrderToInvoice(
  purchaseOrderId: string,
  workspaceId: string,
): Promise<Invoice> {
  return ipc("convert_purchase_order_to_invoice", {
    purchaseOrderId,
    workspaceId,
  });
}

