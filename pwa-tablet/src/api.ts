const KEY_TOKEN = "invoicies_tablet_token";
const KEY_BASE = "invoicies_tablet_api_base";
const KEY_WS = "invoicies_tablet_workspace_id";

export type StoredAuth = {
  token: string;
  apiBase: string;
  workspaceId: string;
};

export function getStoredAuth(): StoredAuth | null {
  const token = localStorage.getItem(KEY_TOKEN);
  const apiBase = localStorage.getItem(KEY_BASE);
  const workspaceId = localStorage.getItem(KEY_WS);
  if (!token || !apiBase || !workspaceId) return null;
  return { token, apiBase, workspaceId };
}

export function setStoredAuth(a: StoredAuth): void {
  localStorage.setItem(KEY_TOKEN, a.token);
  localStorage.setItem(KEY_BASE, a.apiBase);
  localStorage.setItem(KEY_WS, a.workspaceId);
}

export function clearStoredAuth(): void {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_BASE);
  localStorage.removeItem(KEY_WS);
}

export type ApiErr = { error: string };

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const auth = getStoredAuth();
  if (!auth) throw new Error("Non connecté");
  const url = `${auth.apiBase.replace(/\/$/, "")}${path}`;
  const headers: HeadersInit = {
    ...(init.headers ?? {}),
    Authorization: `Bearer ${auth.token}`,
  };
  let body = init.body;
  if (init.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }
  const res = await fetch(url, { ...init, headers, body });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || res.statusText };
  }
  if (!res.ok) {
    const err = (data as ApiErr)?.error ?? res.statusText;
    throw new Error(typeof err === "string" ? err : JSON.stringify(err));
  }
  return data as T;
}

export async function pairFromQrPayload(raw: string): Promise<StoredAuth> {
  const parsed = JSON.parse(raw) as {
    apiUrl?: string;
    api_url?: string;
    pairingToken?: string;
    pairing_token?: string;
  };
  const apiUrl = parsed.apiUrl ?? parsed.api_url;
  const pairingToken = parsed.pairingToken ?? parsed.pairing_token;
  if (!apiUrl || !pairingToken) {
    throw new Error("QR invalide : champs apiUrl et pairingToken attendus.");
  }
  const base = apiUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/api/v1/auth/pair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pairingToken }),
  });
  const data = (await res.json()) as {
    accessToken?: string;
    access_token?: string;
    workspaceId?: string;
    workspace_id?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Échec du pairing");
  }
  const token = data.accessToken ?? data.access_token;
  const workspaceId = data.workspaceId ?? data.workspace_id;
  if (!token || !workspaceId) {
    throw new Error("Réponse pairing incomplète");
  }
  const auth: StoredAuth = { token, apiBase: base, workspaceId };
  setStoredAuth(auth);
  return auth;
}

export async function loginPassword(input: {
  apiBase: string;
  workspaceId: string;
  username: string;
  password: string;
}): Promise<StoredAuth> {
  const base = input.apiBase.replace(/\/$/, "");
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: input.username,
      password: input.password,
      workspaceId: input.workspaceId,
    }),
  });
  const data = (await res.json()) as {
    accessToken?: string;
    access_token?: string;
    workspaceId?: string;
    workspace_id?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Connexion refusée");
  }
  const token = data.accessToken ?? data.access_token;
  const workspaceId = data.workspaceId ?? data.workspace_id;
  if (!token || !workspaceId) {
    throw new Error("Réponse login incomplète");
  }
  const auth: StoredAuth = { token, apiBase: base, workspaceId };
  setStoredAuth(auth);
  return auth;
}

export type ClientRow = {
  id: string;
  workspaceId: string;
  name: string;
  email: string | null;
  phone: string | null;
  addressJson: string | null;
  notes: string | null;
  detailsJson: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ArticleRow = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  basePrice: number;
  optionsJson: string;
};

export type TaxRateRow = {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
};

export type QuoteLineRow = {
  id: string;
  articleId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  billingMode: string;
};

export type QuoteRow = {
  id: string;
  workspaceId: string;
  clientId: string | null;
  number: string;
  title: string;
  status: string;
  currency: string;
  taxExempt: boolean;
  issueDate: string;
  validUntil: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  notes: string | null;
  lines: QuoteLineRow[];
};

export async function fetchClients(): Promise<ClientRow[]> {
  return apiFetch("/api/v1/clients");
}

export async function createClient(body: {
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}): Promise<ClientRow> {
  return apiFetch("/api/v1/clients", { method: "POST", json: body });
}

export async function fetchProducts(): Promise<ArticleRow[]> {
  return apiFetch("/api/v1/products");
}

export async function fetchTaxRates(): Promise<TaxRateRow[]> {
  return apiFetch("/api/v1/tax-rates");
}

export async function fetchQuotes(): Promise<QuoteRow[]> {
  return apiFetch("/api/v1/quotes");
}

export async function fetchQuote(id: string): Promise<QuoteRow> {
  return apiFetch(`/api/v1/quotes/${encodeURIComponent(id)}`);
}

export type QuoteLineInput = {
  id?: string;
  articleId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  billingMode?: string;
  optionsSnapshotJson?: Record<string, unknown>;
  lineNote?: string;
  showNoteOnQuote?: boolean;
  lineDiscountKind?: string;
  lineDiscountValue?: number;
  lineDiscountLabel?: string;
};

export type QuoteInput = {
  title?: string | null;
  clientId?: string | null;
  status: string;
  currency: string;
  taxExempt: boolean;
  issueDate: string;
  validUntil?: string | null;
  notes?: string | null;
  lines: QuoteLineInput[];
  useCustomNumber?: boolean;
  customNumber?: string;
  complements?: unknown[];
  archived?: boolean;
  discountKind?: string;
  discountValue?: number;
  discountLabel?: string;
  projectId?: string;
  pdfTemplateVariant?: string;
};

export async function createQuote(input: QuoteInput): Promise<QuoteRow> {
  return apiFetch("/api/v1/quotes", { method: "POST", json: input });
}

export async function updateQuote(
  id: string,
  input: QuoteInput,
): Promise<QuoteRow> {
  return apiFetch(`/api/v1/quotes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    json: input,
  });
}
