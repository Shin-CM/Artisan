/**
 * Registre des types de paquets importés (chaîne v1:).
 * Chaque `kind` correspond à un tableau `records` homogène.
 */
import * as api from "@/lib/api";
import {
  invoiceToImportInput,
  quoteToImportInput,
} from "@/lib/documentExportImport";

export type GenericPayload = {
  kind?: string;
  schemaVersion?: number;
  records?: unknown[];
};

export type ImportBatchResult = {
  module: string;
  count: number;
  failed: number;
};

export async function importClientRecords(
  workspaceId: string,
  records: { name?: string; email?: string | null }[],
): Promise<{ count: number; failed: number }> {
  let count = 0;
  let failed = 0;
  for (const r of records) {
    const name = r?.name?.trim();
    if (!name) {
      failed++;
      continue;
    }
    try {
      await api.createClient(workspaceId, {
        name,
        email: r.email ?? null,
      });
      count++;
    } catch {
      failed++;
    }
  }
  return { count, failed };
}

type CategoryExportRecord = {
  id: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
};

async function importCategoryRecords(
  workspaceId: string,
  records: CategoryExportRecord[],
): Promise<{ count: number; failed: number }> {
  const idMap = new Map<string, string>();
  const allIds = new Set(records.map((r) => r.id));
  let remaining = [...records];
  let count = 0;
  let failed = 0;
  let guard = 0;
  while (remaining.length > 0 && guard < records.length + 10) {
    guard++;
    const next: CategoryExportRecord[] = [];
    let progressed = 0;
    for (const r of remaining) {
      const p = r.parentId;
      const parentReady =
        !p || idMap.has(p) || !allIds.has(p);
      if (!parentReady) {
        next.push(r);
        continue;
      }
      const parentNew =
        p && idMap.has(p) ? idMap.get(p)! : null;
      const nm = String(r.name ?? "").trim();
      if (!nm) {
        failed++;
        progressed++;
        continue;
      }
      try {
        const c = await api.createCategory(workspaceId, nm, parentNew);
        idMap.set(r.id, c.id);
        count++;
        progressed++;
      } catch {
        failed++;
        progressed++;
      }
    }
    if (progressed === 0) {
      failed += next.length;
      break;
    }
    remaining = next;
  }
  return { count, failed };
}

type ArticleExportRecord = {
  categoryId?: string | null;
  name?: string;
  description?: string | null;
  basePrice?: number;
  flatPrice?: number | null;
  hourlyRate?: number | null;
  productionCost?: number | null;
  optionsJson?: string | unknown;
  supplierName?: string | null;
  supplierReference?: string | null;
};

async function importArticleRecords(
  workspaceId: string,
  records: ArticleExportRecord[],
): Promise<{ count: number; failed: number }> {
  const cats = await api.listCategories(workspaceId);
  const catIds = new Set(cats.map((c) => c.id));
  let count = 0;
  let failed = 0;
  for (const r of records) {
    const name = String(r?.name ?? "").trim();
    if (!name) {
      failed++;
      continue;
    }
    let categoryId: string | null =
      r.categoryId && catIds.has(r.categoryId) ? r.categoryId : null;
    const basePrice = Number(r.basePrice ?? 0);
    let optionsJson: unknown = r.optionsJson ?? "{}";
    if (typeof optionsJson === "string") {
      try {
        optionsJson = JSON.parse(optionsJson);
      } catch {
        optionsJson = {};
      }
    }
    try {
      await api.createArticle(workspaceId, {
        name,
        description: r.description ?? null,
        categoryId,
        basePrice: Number.isFinite(basePrice) ? basePrice : 0,
        flatPrice: r.flatPrice ?? null,
        hourlyRate: r.hourlyRate ?? null,
        productionCost: r.productionCost ?? null,
        optionsJson,
        supplierName:
          typeof r.supplierName === "string" ? r.supplierName : null,
        supplierReference:
          typeof r.supplierReference === "string"
            ? r.supplierReference
            : null,
      });
      count++;
    } catch {
      failed++;
    }
  }
  return { count, failed };
}

async function importTaxRateRecords(
  workspaceId: string,
  records: { name?: string; rate?: number }[],
): Promise<{ count: number; failed: number }> {
  let count = 0;
  let failed = 0;
  for (const r of records) {
    const name = String(r?.name ?? "").trim();
    const rate = Number(r?.rate);
    if (!name || !Number.isFinite(rate)) {
      failed++;
      continue;
    }
    try {
      await api.createTaxRate(workspaceId, { name, rate });
      count++;
    } catch {
      failed++;
    }
  }
  return { count, failed };
}

async function importSnippetRecords(
  workspaceId: string,
  records: { name?: string; body?: string }[],
): Promise<{ count: number; failed: number }> {
  let count = 0;
  let failed = 0;
  for (const r of records) {
    const name = String(r?.name ?? "").trim();
    const body = String(r?.body ?? "");
    if (!name) {
      failed++;
      continue;
    }
    try {
      await api.createTextSnippet(workspaceId, { name, body });
      count++;
    } catch {
      failed++;
    }
  }
  return { count, failed };
}

async function importDiscountPresetRecords(
  workspaceId: string,
  records: { name?: string; kind?: string; value?: number }[],
): Promise<{ count: number; failed: number }> {
  let count = 0;
  let failed = 0;
  for (const r of records) {
    const name = String(r?.name ?? "").trim();
    const kind = String(r?.kind ?? "percent");
    const value = Number(r?.value);
    if (!name || !Number.isFinite(value)) {
      failed++;
      continue;
    }
    try {
      await api.createDiscountPreset(workspaceId, { name, kind, value });
      count++;
    } catch {
      failed++;
    }
  }
  return { count, failed };
}

async function importQuoteRecords(
  workspaceId: string,
  records: unknown[],
): Promise<{ count: number; failed: number }> {
  let count = 0;
  let failed = 0;
  for (const r of records) {
    try {
      const q = r as api.Quote;
      if (!q || typeof q !== "object" || !Array.isArray(q.lines)) {
        failed++;
        continue;
      }
      await api.createQuote(workspaceId, quoteToImportInput(q));
      count++;
    } catch {
      failed++;
    }
  }
  return { count, failed };
}

async function importInvoiceRecords(
  workspaceId: string,
  records: unknown[],
): Promise<{ count: number; failed: number }> {
  let count = 0;
  let failed = 0;
  for (const r of records) {
    try {
      const inv = r as api.Invoice;
      if (!inv || typeof inv !== "object" || !Array.isArray(inv.lines)) {
        failed++;
        continue;
      }
      await api.createInvoice(workspaceId, invoiceToImportInput(inv));
      count++;
    } catch {
      failed++;
    }
  }
  return { count, failed };
}

export async function importRecordsForWorkspace(
  workspaceId: string,
  kind: string,
  records: unknown[],
): Promise<{ count: number; failed: number }> {
  switch (kind) {
    case "clients":
      return importClientRecords(
        workspaceId,
        records as { name?: string; email?: string | null }[],
      );
    case "categories":
      return importCategoryRecords(
        workspaceId,
        records as CategoryExportRecord[],
      );
    case "articles":
      return importArticleRecords(workspaceId, records as ArticleExportRecord[]);
    case "tax-rates":
      return importTaxRateRecords(
        workspaceId,
        records as { name?: string; rate?: number }[],
      );
    case "snippets":
      return importSnippetRecords(
        workspaceId,
        records as { name?: string; body?: string }[],
      );
    case "discount-presets":
      return importDiscountPresetRecords(
        workspaceId,
        records as { name?: string; kind?: string; value?: number }[],
      );
    case "quotes":
      return importQuoteRecords(workspaceId, records);
    case "invoices":
      return importInvoiceRecords(workspaceId, records);
    case "projects":
      return importProjectBundleRecords(workspaceId, records);
    default:
      throw new Error(`Type de paquet non reconnu : ${kind}`);
  }
}

async function importProjectBundleRecords(
  workspaceId: string,
  records: unknown[],
): Promise<{ count: number; failed: number }> {
  const mapped: api.ProjectImportRecord[] = [];
  for (const r of records) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const status = typeof o.status === "string" ? o.status.trim() : "";
    if (!id || !name || !status) continue;
    mapped.push({
      id,
      clientId: typeof o.clientId === "string" ? o.clientId : null,
      code: typeof o.code === "string" ? o.code : null,
      name,
      status,
      startDate: typeof o.startDate === "string" ? o.startDate : null,
      endDate: typeof o.endDate === "string" ? o.endDate : null,
      budgetEstimate:
        typeof o.budgetEstimate === "number" && Number.isFinite(o.budgetEstimate)
          ? o.budgetEstimate
          : null,
      notes: typeof o.notes === "string" ? o.notes : null,
      createdAt: typeof o.createdAt === "string" ? o.createdAt : null,
      updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : null,
    });
  }
  if (mapped.length === 0) return { count: 0, failed: 0 };
  try {
    await api.importProjectsBundle(workspaceId, mapped);
    return { count: mapped.length, failed: 0 };
  } catch {
    return { count: 0, failed: mapped.length };
  }
}

export async function importPayloadForWorkspace(
  workspaceId: string,
  data: GenericPayload,
): Promise<ImportBatchResult> {
  const kind = data.kind;
  if (!kind || !Array.isArray(data.records)) {
    throw new Error("Type de paquet non reconnu ou schéma invalide");
  }
  const { count, failed } = await importRecordsForWorkspace(
    workspaceId,
    kind,
    data.records,
  );
  return { module: kind, count, failed };
}

/** Sérialise les enregistrements pour export v1 (sans métadonnées d’enveloppe). */
export function recordsForKindFromWorkspaceData(
  kind: string,
  data: {
    clients?: api.Client[];
    categories?: api.Category[];
    articles?: api.Article[];
    taxRates?: api.TaxRate[];
    snippets?: api.TextSnippet[];
    presets?: api.DiscountPreset[];
    projects?: api.Project[];
    quotes?: api.Quote[];
    invoices?: api.Invoice[];
    articleFilter?: {
      mode: "all" | "uncat" | "category";
      categoryId?: string;
    };
  },
): unknown[] {
  switch (kind) {
    case "clients":
      return (data.clients ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        addressJson: c.addressJson,
        notes: c.notes,
        detailsJson: c.detailsJson,
        sortOrder: c.sortOrder,
      }));
    case "categories":
      return (data.categories ?? []).map((c) => ({
        id: c.id,
        parentId: c.parentId,
        name: c.name,
        sortOrder: c.sortOrder,
      }));
    case "articles": {
      let arts = data.articles ?? [];
      const f = data.articleFilter;
      if (f?.mode === "uncat") {
        arts = arts.filter((a) => !a.categoryId);
      } else if (f?.mode === "category" && f.categoryId) {
        arts = arts.filter((a) => a.categoryId === f.categoryId);
      }
      return arts.map((a) => ({
        id: a.id,
        categoryId: a.categoryId,
        name: a.name,
        description: a.description,
        basePrice: a.basePrice,
        flatPrice: a.flatPrice,
        hourlyRate: a.hourlyRate,
        productionCost: a.productionCost,
        optionsJson: a.optionsJson,
        sortOrder: a.sortOrder,
      }));
    }
    case "tax-rates":
      return (data.taxRates ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        rate: t.rate,
        isDefault: t.isDefault,
      }));
    case "snippets":
      return (data.snippets ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        body: s.body,
      }));
    case "discount-presets":
      return (data.presets ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        kind: p.kind,
        value: p.value,
        sortOrder: p.sortOrder,
      }));
    case "projects":
      return (data.projects ?? []).map((p) => ({
        id: p.id,
        clientId: p.clientId,
        code: p.code,
        name: p.name,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        budgetEstimate: p.budgetEstimate,
        notes: p.notes,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    case "quotes":
      return data.quotes ?? [];
    case "invoices":
      return data.invoices ?? [];
    default:
      return [];
  }
}
