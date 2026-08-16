import type {
  Article,
  Category,
  Client,
  CrmOpportunity,
  DiscountPreset,
  ImportHistoryRow,
  Invoice,
  ManualRevenueEntry,
  PluginRow,
  Project,
  ProjectTimeEntry,
  StockArticleSettingRow,
  StockMovementRow,
  Quote,
  TaxRate,
  TextSnippet,
  Workspace,
} from "@/lib/api";
import { defaultTaxRatesForCountry } from "@/lib/workspaceDefaultTaxRates";

export const DEMO_WS_ID = "mock-ws-demo";

/** Renvoyé par `pick_logo_file_path` en mock ; la copie attache l’image choisie au workspace. */
export const MOCK_LOGO_PICK_SENTINEL = "__invoicies_mock_logo_pick__";

export function now(): string {
  return new Date().toISOString();
}

export function rid(): string {
  return crypto.randomUUID();
}

export type MockStore = {
  workspaces: Workspace[];
  clients: Client[];
  categories: Category[];
  articles: Article[];
  quotes: Quote[];
  /** Même forme que `Quote` (API `PurchaseOrder`). */
  purchaseOrders: Quote[];
  invoices: Invoice[];
  importHistory: ImportHistoryRow[];
  plugins: PluginRow[];
  taxRates: TaxRate[];
  discountPresets: DiscountPreset[];
  quoteSeq: Record<string, number>;
  purchaseOrderSeq: Record<string, number>;
  invoiceSeq: Record<string, number>;
  creditNoteSeq: Record<string, number>;
  crmOpportunities: CrmOpportunity[];
  projects: Project[];
  projectTimeEntries: ProjectTimeEntry[];
  /** Mouvements de stock (mock navigateur), avec workspace pour filtrage. */
  stockMovements: Array<StockMovementRow & { workspaceId: string }>;
  stockArticleSettings: Array<
    StockArticleSettingRow & { workspaceId: string; updatedAt: string }
  >;
  textSnippets: TextSnippet[];
  manualRevenueEntries: ManualRevenueEntry[];
  /** workspaceId → data URL (aperçu / PDF en mode navigateur). */
  workspaceLogoDataUrls: Record<string, string>;
  /** `workspaceId::relativePath` → data URL police PDF (mock import). */
  workspaceFontDataUrls: Record<string, string>;
  mockPendingLogoDataUrl: string | null;
};

function emptyStore(): MockStore {
  const t = now();
  const demo: Workspace = {
    id: DEMO_WS_ID,
    name: "Espace démo (navigateur)",
    entityType: "company",
    countryCode: "FR",
    profileJson: JSON.stringify({
      address: { city: "Paris", countryCode: "FR" },
    }),
    baseCurrency: "EUR",
    theme: "system",
    pdfOutputDir: null,
    createdAt: t,
    updatedAt: t,
  };
  return {
    workspaces: [demo],
    clients: [],
    categories: [],
    articles: [],
    quotes: [],
    purchaseOrders: [],
    invoices: [],
    importHistory: [],
    plugins: [],
    discountPresets: [],
    taxRates: defaultTaxRatesForCountry(demo.countryCode).map(
      (r): TaxRate => ({
        id: rid(),
        workspaceId: DEMO_WS_ID,
        name: r.name,
        rate: r.rate,
        isDefault: false,
      }),
    ),
    quoteSeq: { [DEMO_WS_ID]: 0 },
    purchaseOrderSeq: { [DEMO_WS_ID]: 0 },
    invoiceSeq: { [DEMO_WS_ID]: 0 },
    creditNoteSeq: { [DEMO_WS_ID]: 0 },
    crmOpportunities: [],
    projects: [],
    projectTimeEntries: [],
    stockMovements: [],
    stockArticleSettings: [],
    textSnippets: [],
    manualRevenueEntries: [],
    workspaceLogoDataUrls: {},
    workspaceFontDataUrls: {},
    mockPendingLogoDataUrl: null,
  };
}

export let store: MockStore = emptyStore();

export function resetApiMockStore(): void {
  store = emptyStore();
}

/** Prochain numéro mock sans consommer la séquence (aligné sur `nextQuoteNumber`). */
export function peekNextQuoteNumber(wsId: string): string {
  const next = (store.quoteSeq[wsId] ?? 0) + 1;
  return `D-${String(next).padStart(4, "0")}`;
}

export function nextQuoteNumber(wsId: string): string {
  store.quoteSeq[wsId] = (store.quoteSeq[wsId] ?? 0) + 1;
  return `D-${String(store.quoteSeq[wsId]).padStart(4, "0")}`;
}

export function quoteNumberTaken(
  workspaceId: string,
  number: string,
  excludeQuoteId?: string,
): boolean {
  return store.quotes.some(
    (q) =>
      q.workspaceId === workspaceId &&
      q.number === number &&
      q.id !== excludeQuoteId,
  );
}

/** Prochain numéro mock sans consommer la séquence. */
export function peekNextInvoiceNumber(wsId: string): string {
  const next = (store.invoiceSeq[wsId] ?? 0) + 1;
  return `F-${String(next).padStart(4, "0")}`;
}

export function nextInvoiceNumber(wsId: string): string {
  store.invoiceSeq[wsId] = (store.invoiceSeq[wsId] ?? 0) + 1;
  return `F-${String(store.invoiceSeq[wsId]).padStart(4, "0")}`;
}

export function invoiceNumberTaken(
  workspaceId: string,
  number: string,
  excludeInvoiceId?: string,
): boolean {
  return store.invoices.some(
    (inv) =>
      inv.workspaceId === workspaceId &&
      inv.number === number &&
      inv.id !== excludeInvoiceId,
  );
}

export function peekNextPurchaseOrderNumber(wsId: string): string {
  const next = (store.purchaseOrderSeq[wsId] ?? 0) + 1;
  return `B-${String(next).padStart(4, "0")}`;
}

export function nextPurchaseOrderNumber(wsId: string): string {
  store.purchaseOrderSeq[wsId] = (store.purchaseOrderSeq[wsId] ?? 0) + 1;
  return `B-${String(store.purchaseOrderSeq[wsId]).padStart(4, "0")}`;
}

export function purchaseOrderNumberTaken(
  workspaceId: string,
  number: string,
  excludeId?: string,
): boolean {
  return store.purchaseOrders.some(
    (q) =>
      q.workspaceId === workspaceId &&
      q.number === number &&
      q.id !== excludeId,
  );
}

export function peekNextCreditNoteNumber(wsId: string): string {
  const next = (store.creditNoteSeq[wsId] ?? 0) + 1;
  return `A-${String(next).padStart(4, "0")}`;
}

export function nextCreditNoteNumber(wsId: string): string {
  store.creditNoteSeq[wsId] = (store.creditNoteSeq[wsId] ?? 0) + 1;
  return `A-${String(store.creditNoteSeq[wsId]).padStart(4, "0")}`;
}
