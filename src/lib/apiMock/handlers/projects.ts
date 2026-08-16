import type {
  Invoice,
  InvoiceLine,
  Project,
  ProjectDocument,
  ProjectFinancialSummary,
  ProjectImportRecord,
  ProjectInput,
  ProjectLinkCounts,
  ProjectTimeEntry,
  ProjectTimeEntryInput,
  ProjectTimeInvoiceLineOption,
  ProjectTimeInvoiceSummary,
} from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { now, rid, store } from "@/lib/apiMock/store";

const STATUSES = new Set([
  "draft",
  "active",
  "on_hold",
  "completed",
  "cancelled",
]);

function findInvoiceLineById(
  lineId: string,
): { inv: Invoice; line: InvoiceLine } | null {
  for (const inv of store.invoices) {
    const line = inv.lines.find((l) => l.id === lineId);
    if (line) return { inv, line };
  }
  return null;
}

/** Aligné sur `validate_invoice_line_for_project_time` (Rust). */
function validateInvoiceLineForProjectTime(
  workspaceId: string,
  projectId: string,
  lineId: string | null | undefined,
): void {
  const lid = lineId?.trim();
  if (!lid) return;
  const found = findInvoiceLineById(lid);
  if (!found) {
    throw new Error("Ligne de facture introuvable.");
  }
  const { inv, line } = found;
  if (inv.workspaceId !== workspaceId) {
    throw new Error("La facture n’appartient pas à cet espace.");
  }
  if ((inv.documentKind ?? "invoice") !== "invoice") {
    throw new Error(
      "Seules les factures classiques permettent d’imputer du temps sur une ligne.",
    );
  }
  if (inv.archived === true) {
    throw new Error("Facture archivée : imputation de temps impossible.");
  }
  if (inv.projectId?.trim() !== projectId) {
    throw new Error(
      "La facture doit être liée au même projet que cette entrée de temps.",
    );
  }
  if (inv.status.trim() === "paid") {
    throw new Error(
      "Impossible de lier du temps à une facture au statut « Payée ».",
    );
  }
  if (line.billingMode.trim() !== "hourly") {
    throw new Error(
      "Seules les lignes en facturation « à l’heure » peuvent être liées au temps passé.",
    );
  }
}

function enrichProjectTimeEntry(e: ProjectTimeEntry): ProjectTimeEntry {
  const lid = e.invoiceLineId?.trim();
  if (!lid) {
    return { ...e, invoiceNumber: null, invoiceLineLabel: null };
  }
  const found = findInvoiceLineById(lid);
  if (!found) {
    return { ...e, invoiceNumber: null, invoiceLineLabel: null };
  }
  const desc = found.line.description?.trim() ?? "";
  return {
    ...e,
    invoiceNumber: found.inv.number,
    invoiceLineLabel: desc.length > 0 ? desc : null,
  };
}

export function ensureProjectWorkspace(
  wsId: string,
  projectId: string | null | undefined,
) {
  const pid = projectId?.trim();
  if (!pid) return;
  const ok = store.projects.some((p) => p.id === pid && p.workspaceId === wsId);
  if (!ok) throw new Error("Projet introuvable dans cet espace.");
}

function projectCodeTaken(
  workspaceId: string,
  code: string | null,
  excludeProjectId?: string,
): boolean {
  if (!code) return false;
  return store.projects.some(
    (p) =>
      p.workspaceId === workspaceId &&
      p.code?.trim() === code &&
      p.id !== excludeProjectId,
  );
}

function financialSummaryForProject(projectId: string): ProjectFinancialSummary {
  const p = store.projects.find((x) => x.id === projectId);
  const ws = p?.workspaceId ?? "";
  let invoicedTotal = 0;
  let creditNotesTotal = 0;
  for (const inv of store.invoices) {
    if (inv.workspaceId !== ws || inv.projectId !== projectId || inv.archived)
      continue;
    const dk = inv.documentKind ?? "invoice";
    if (dk === "credit_note") creditNotesTotal += inv.total;
    else invoicedTotal += inv.total;
  }
  let quotesAcceptedTotal = 0;
  for (const q of store.quotes) {
    if (
      q.workspaceId === ws &&
      q.projectId === projectId &&
      !q.archived &&
      q.status === "accepted"
    ) {
      quotesAcceptedTotal += q.total;
    }
  }
  let purchaseOrdersTotal = 0;
  for (const po of store.purchaseOrders) {
    if (
      po.workspaceId === ws &&
      po.projectId === projectId &&
      !po.archived
    ) {
      purchaseOrdersTotal += po.total;
    }
  }
  return {
    budgetEstimate: p?.budgetEstimate ?? null,
    invoicedTotal,
    creditNotesTotal,
    quotesAcceptedTotal,
    purchaseOrdersTotal,
  };
}

export const projectHandlers: Record<string, MockHandler> = {
  list_projects: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.projects
      .filter((p) => p.workspaceId === workspaceId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name));
  },

  get_project: (args) => {
    const id = args.id as string;
    const p = store.projects.find((x) => x.id === id);
    if (!p) throw new Error("Projet introuvable.");
    return p;
  },

  create_project: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as ProjectInput;
    const status = input.status?.trim() ?? "";
    if (!STATUSES.has(status)) {
      throw new Error(`Statut de projet invalide : ${status}`);
    }
    const name = input.name?.trim() ?? "";
    if (!name) throw new Error("Le nom du projet est obligatoire.");
    const t = now();
    const code =
      input.code?.trim() && input.code.trim().length > 0
        ? input.code.trim()
        : null;
    if (projectCodeTaken(workspaceId, code)) {
      throw new Error("Ce code projet est déjà utilisé dans cet espace.");
    }
    const row: Project = {
      id: rid(),
      workspaceId,
      clientId: input.clientId ?? null,
      code,
      name,
      status,
      startDate: input.startDate?.trim() || null,
      endDate: input.endDate?.trim() || null,
      budgetEstimate:
        input.budgetEstimate != null && Number.isFinite(input.budgetEstimate)
          ? input.budgetEstimate
          : null,
      notes: input.notes?.trim() || null,
      createdAt: t,
      updatedAt: t,
    };
    if (row.clientId) {
      const c = store.clients.find(
        (x) => x.id === row.clientId && x.workspaceId === workspaceId,
      );
      if (!c) throw new Error("Client introuvable dans cet espace.");
    }
    store.projects.push(row);
    return row;
  },

  update_project: (args) => {
    const id = args.id as string;
    const input = args.input as ProjectInput;
    const idx = store.projects.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error("Projet introuvable.");
    const old = store.projects[idx];
    const status = input.status?.trim() ?? "";
    if (!STATUSES.has(status)) {
      throw new Error(`Statut de projet invalide : ${status}`);
    }
    const name = input.name?.trim() ?? "";
    if (!name) throw new Error("Le nom du projet est obligatoire.");
    const code =
      input.code?.trim() && input.code.trim().length > 0
        ? input.code.trim()
        : null;
    if (projectCodeTaken(old.workspaceId, code, id)) {
      throw new Error("Ce code projet est déjà utilisé dans cet espace.");
    }
    if (input.clientId) {
      const c = store.clients.find(
        (x) => x.id === input.clientId && x.workspaceId === old.workspaceId,
      );
      if (!c) throw new Error("Client introuvable dans cet espace.");
    }
    const t = now();
    const next: Project = {
      ...old,
      clientId: input.clientId ?? null,
      code,
      name,
      status,
      startDate: input.startDate?.trim() || null,
      endDate: input.endDate?.trim() || null,
      budgetEstimate:
        input.budgetEstimate != null && Number.isFinite(input.budgetEstimate)
          ? input.budgetEstimate
          : null,
      notes: input.notes?.trim() || null,
      updatedAt: t,
    };
    store.projects[idx] = next;
    return next;
  },

  delete_project: (args) => {
    const id = args.id as string;
    store.projects = store.projects.filter((p) => p.id !== id);
    store.projectTimeEntries = store.projectTimeEntries.filter(
      (e) => e.projectId !== id,
    );
    for (const q of store.quotes) {
      if (q.projectId === id) q.projectId = null;
    }
    for (const po of store.purchaseOrders) {
      if (po.projectId === id) po.projectId = null;
    }
    for (const inv of store.invoices) {
      if (inv.projectId === id) inv.projectId = null;
    }
    for (const o of store.crmOpportunities) {
      if (o.projectId === id) o.projectId = null;
    }
    return undefined;
  },

  count_project_links: (args) => {
    const projectId = args.projectId as string;
    const p = store.projects.find((x) => x.id === projectId);
    if (!p) throw new Error("Projet introuvable.");
    const ws = p.workspaceId;
    let quotes = 0;
    let invoices = 0;
    let creditNotes = 0;
    for (const q of store.quotes) {
      if (q.workspaceId === ws && q.projectId === projectId) quotes++;
    }
    for (const inv of store.invoices) {
      if (inv.workspaceId !== ws || inv.projectId !== projectId) continue;
      if ((inv.documentKind ?? "invoice") === "credit_note") creditNotes++;
      else invoices++;
    }
    let purchaseOrders = 0;
    for (const po of store.purchaseOrders) {
      if (po.workspaceId === ws && po.projectId === projectId) purchaseOrders++;
    }
    let crmOpportunities = 0;
    for (const o of store.crmOpportunities) {
      if (o.workspaceId === ws && o.projectId === projectId) crmOpportunities++;
    }
    const out: ProjectLinkCounts = {
      quotes,
      invoices,
      creditNotes,
      purchaseOrders,
      crmOpportunities,
    };
    return out;
  },

  get_project_financial_summary: (args) => {
    const projectId = args.projectId as string;
    if (!store.projects.some((x) => x.id === projectId)) {
      throw new Error("Projet introuvable.");
    }
    return financialSummaryForProject(projectId);
  },

  import_projects_bundle: (args) => {
    const workspaceId = args.workspaceId as string;
    const records = args.records as ProjectImportRecord[];
    const t = now();
    for (const rec of records) {
      const id = rec.id?.trim() ?? "";
      if (!id) continue;
      const status = rec.status?.trim() ?? "";
      if (!STATUSES.has(status)) continue;
      const name = rec.name?.trim() ?? "";
      if (!name) continue;
      const code =
        rec.code?.trim() && rec.code.trim().length > 0
          ? rec.code.trim()
          : null;
      if (projectCodeTaken(workspaceId, code, id)) continue;
      if (rec.clientId) {
        const c = store.clients.find(
          (x) => x.id === rec.clientId && x.workspaceId === workspaceId,
        );
        if (!c) continue;
      }
      const idx = store.projects.findIndex((p) => p.id === id);
      const row: Project = {
        id,
        workspaceId,
        clientId: rec.clientId ?? null,
        code,
        name,
        status,
        startDate: rec.startDate?.trim() || null,
        endDate: rec.endDate?.trim() || null,
        budgetEstimate:
          rec.budgetEstimate != null && Number.isFinite(rec.budgetEstimate)
            ? rec.budgetEstimate
            : null,
        notes: rec.notes?.trim() || null,
        createdAt: rec.createdAt?.trim() || t,
        updatedAt: rec.updatedAt?.trim() || t,
      };
      if (idx >= 0) store.projects[idx] = row;
      else store.projects.push(row);
    }
    return undefined;
  },

  list_invoices_for_project_time: (args) => {
    const projectId = args.projectId as string;
    const p = store.projects.find((x) => x.id === projectId);
    if (!p) throw new Error("Projet introuvable.");
    const ws = p.workspaceId;
    const rows: ProjectTimeInvoiceSummary[] = store.invoices
      .filter(
        (inv) =>
          inv.workspaceId === ws &&
          inv.projectId === projectId &&
          (inv.documentKind ?? "invoice") === "invoice" &&
          inv.archived !== true &&
          inv.status.trim() !== "paid",
      )
      .sort(
        (a, b) =>
          b.issueDate.localeCompare(a.issueDate) ||
          b.number.localeCompare(a.number),
      )
      .map((inv) => ({
        id: inv.id,
        number: inv.number,
        issueDate: inv.issueDate,
        status: inv.status,
      }));
    return rows;
  },

  list_invoice_lines_for_project_time: (args) => {
    const projectId = args.projectId as string;
    const invoiceId = (args.invoiceId ?? args.invoice_id) as string;
    const p = store.projects.find((x) => x.id === projectId);
    if (!p) throw new Error("Projet introuvable.");
    const ws = p.workspaceId;
    const inv = store.invoices.find((i) => i.id === invoiceId);
    if (
      !inv ||
      inv.workspaceId !== ws ||
      inv.projectId !== projectId ||
      (inv.documentKind ?? "invoice") !== "invoice" ||
      inv.archived === true ||
      inv.status.trim() === "paid"
    ) {
      throw new Error("Facture introuvable ou non éligible pour ce projet.");
    }
    const lines: ProjectTimeInvoiceLineOption[] = inv.lines
      .filter((l) => l.billingMode.trim() === "hourly")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((l) => ({ id: l.id, description: l.description }));
    return lines;
  },

  list_project_time_entries: (args) => {
    const projectId = args.projectId as string;
    if (!store.projects.some((x) => x.id === projectId)) {
      throw new Error("Projet introuvable.");
    }
    return store.projectTimeEntries
      .filter((e) => e.projectId === projectId)
      .sort(
        (a, b) =>
          b.workDate.localeCompare(a.workDate) ||
          b.createdAt.localeCompare(a.createdAt),
      )
      .map((e) => enrichProjectTimeEntry(e));
  },

  create_project_time_entry: (args) => {
    const projectId = args.projectId as string;
    const input = args.input as ProjectTimeEntryInput;
    const p = store.projects.find((x) => x.id === projectId);
    if (!p) throw new Error("Projet introuvable.");
    if (input.durationMinutes <= 0) {
      throw new Error("La durée doit être positive.");
    }
    validateInvoiceLineForProjectTime(
      p.workspaceId,
      projectId,
      input.invoiceLineId,
    );
    const t = now();
    const id = rid();
    const row: ProjectTimeEntry = {
      id,
      workspaceId: p.workspaceId,
      projectId,
      workDate: input.workDate.trim(),
      durationMinutes: input.durationMinutes,
      description: input.description?.trim() || null,
      billable: input.billable !== false,
      invoiceLineId: input.invoiceLineId?.trim() || null,
      createdAt: t,
      updatedAt: t,
    };
    store.projectTimeEntries.push(row);
    return enrichProjectTimeEntry(row);
  },

  update_project_time_entry: (args) => {
    const id = args.id as string;
    const input = args.input as ProjectTimeEntryInput;
    if (input.durationMinutes <= 0) {
      throw new Error("La durée doit être positive.");
    }
    const idx = store.projectTimeEntries.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error("Entrée introuvable.");
    const old = store.projectTimeEntries[idx];
    const p = store.projects.find((x) => x.id === old.projectId);
    if (!p) throw new Error("Projet introuvable.");
    validateInvoiceLineForProjectTime(
      p.workspaceId,
      old.projectId,
      input.invoiceLineId,
    );
    const t = now();
    const next: ProjectTimeEntry = {
      ...old,
      workDate: input.workDate.trim(),
      durationMinutes: input.durationMinutes,
      description: input.description?.trim() || null,
      billable: input.billable !== false,
      invoiceLineId: input.invoiceLineId?.trim() || null,
      updatedAt: t,
    };
    store.projectTimeEntries[idx] = next;
    return enrichProjectTimeEntry(next);
  },

  delete_project_time_entry: (args) => {
    const id = args.id as string;
    const before = store.projectTimeEntries.length;
    store.projectTimeEntries = store.projectTimeEntries.filter((e) => e.id !== id);
    if (store.projectTimeEntries.length === before) {
      throw new Error("Entrée introuvable.");
    }
    return undefined;
  },

  list_project_documents: (args) => {
    const projectId = args.projectId as string;
    const p = store.projects.find((x) => x.id === projectId);
    if (!p) throw new Error("Projet introuvable.");
    const ws = p.workspaceId;
    const out: ProjectDocument[] = [];
    for (const q of store.quotes) {
      if (q.workspaceId === ws && q.projectId === projectId) {
        out.push({
          documentKind: "quote",
          id: q.id,
          number: q.number,
          status: q.status,
          total: q.total,
          archived: q.archived === true,
          issueDate: q.issueDate,
        });
      }
    }
    for (const inv of store.invoices) {
      if (inv.workspaceId === ws && inv.projectId === projectId) {
        out.push({
          documentKind: inv.documentKind ?? "invoice",
          id: inv.id,
          number: inv.number,
          status: inv.status,
          total: inv.total,
          archived: inv.archived === true,
          issueDate: inv.issueDate,
        });
      }
    }
    for (const po of store.purchaseOrders) {
      if (po.workspaceId === ws && po.projectId === projectId) {
        out.push({
          documentKind: "purchase_order",
          id: po.id,
          number: po.number,
          status: po.status,
          total: po.total,
          archived: po.archived === true,
          issueDate: po.issueDate,
        });
      }
    }
    return out;
  },
};
