import { ipc } from "@/lib/apiCore";

export type ProjectStatus =
  | "draft"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

export type Project = {
  id: string;
  workspaceId: string;
  clientId: string | null;
  code: string | null;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budgetEstimate: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInput = {
  clientId?: string | null;
  code?: string | null;
  name: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  budgetEstimate?: number | null;
  notes?: string | null;
};

export type ProjectDocument = {
  documentKind: string;
  id: string;
  number: string;
  status: string;
  total: number;
  archived: boolean;
  /** Date d’émission (ISO) pour la timeline projet. */
  issueDate: string;
};

export type ProjectLinkCounts = {
  quotes: number;
  invoices: number;
  creditNotes: number;
  purchaseOrders: number;
  crmOpportunities: number;
};

/** Règles agrégats : non archivés uniquement ; factures classiques vs avoirs séparés ; devis « accepted » ; BDC. */
export type ProjectFinancialSummary = {
  budgetEstimate: number | null;
  invoicedTotal: number;
  creditNotesTotal: number;
  quotesAcceptedTotal: number;
  purchaseOrdersTotal: number;
};

export type ProjectTimeEntry = {
  id: string;
  workspaceId: string;
  projectId: string;
  workDate: string;
  durationMinutes: number;
  description: string | null;
  billable: boolean;
  invoiceLineId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Présent quand une ligne de facture est liée (liste / agrégation serveur). */
  invoiceNumber?: string | null;
  invoiceLineLabel?: string | null;
};

export type ProjectTimeInvoiceSummary = {
  id: string;
  number: string;
  issueDate: string;
  status: string;
};

export type ProjectTimeInvoiceLineOption = {
  id: string;
  description: string;
};

export type ProjectTimeEntryInput = {
  workDate: string;
  durationMinutes: number;
  description?: string | null;
  billable?: boolean;
  invoiceLineId?: string | null;
};

export type ProjectImportRecord = {
  id: string;
  clientId?: string | null;
  code?: string | null;
  name: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  budgetEstimate?: number | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export async function listProjects(workspaceId: string): Promise<Project[]> {
  return ipc("list_projects", { workspaceId });
}

export async function getProject(id: string): Promise<Project> {
  return ipc("get_project", { id });
}

export async function createProject(
  workspaceId: string,
  input: ProjectInput,
): Promise<Project> {
  return ipc("create_project", { workspaceId, input });
}

export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<Project> {
  return ipc("update_project", { id, input });
}

export async function deleteProject(id: string): Promise<void> {
  return ipc("delete_project", { id });
}

export async function listProjectDocuments(
  projectId: string,
): Promise<ProjectDocument[]> {
  return ipc("list_project_documents", { projectId });
}

export async function countProjectLinks(
  projectId: string,
): Promise<ProjectLinkCounts> {
  return ipc("count_project_links", { projectId });
}

export async function getProjectFinancialSummary(
  projectId: string,
): Promise<ProjectFinancialSummary> {
  return ipc("get_project_financial_summary", { projectId });
}

export async function importProjectsBundle(
  workspaceId: string,
  records: ProjectImportRecord[],
): Promise<void> {
  return ipc("import_projects_bundle", { workspaceId, records });
}

export async function listProjectTimeEntries(
  projectId: string,
): Promise<ProjectTimeEntry[]> {
  return ipc("list_project_time_entries", { projectId });
}

export async function listInvoicesForProjectTime(
  projectId: string,
): Promise<ProjectTimeInvoiceSummary[]> {
  return ipc("list_invoices_for_project_time", { projectId });
}

export async function listInvoiceLinesForProjectTime(
  projectId: string,
  invoiceId: string,
): Promise<ProjectTimeInvoiceLineOption[]> {
  return ipc("list_invoice_lines_for_project_time", { projectId, invoiceId });
}

export async function createProjectTimeEntry(
  projectId: string,
  input: ProjectTimeEntryInput,
): Promise<ProjectTimeEntry> {
  return ipc("create_project_time_entry", { projectId, input });
}

export async function updateProjectTimeEntry(
  id: string,
  input: ProjectTimeEntryInput,
): Promise<ProjectTimeEntry> {
  return ipc("update_project_time_entry", { id, input });
}

export async function deleteProjectTimeEntry(id: string): Promise<void> {
  return ipc("delete_project_time_entry", { id });
}
