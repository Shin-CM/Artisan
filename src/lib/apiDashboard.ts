import { ipc } from "@/lib/apiCore";

export type DashboardStats = {
  revenueTotal: number;
  revenueMonth: number;
  revenueYear: number;
  invoicesOutstanding: number;
  invoicesPaid: number;
};

export async function getDashboardStats(
  workspaceId: string,
  period = "year",
): Promise<DashboardStats> {
  return ipc("get_dashboard_stats", { workspaceId, period });
}

export type RevenueComparisonMonth = {
  month: string;
  monthLabel: string;
  /** Clés = année (chaîne), montants TTC cumulés pour le mois. */
  amounts: Record<string, number>;
};

export type RevenueComparison = {
  /** Années incluses, de la plus récente à la plus ancienne. */
  years: number[];
  months: RevenueComparisonMonth[];
};

export async function getRevenueComparison(
  workspaceId: string,
  yearCount: number,
): Promise<RevenueComparison> {
  return ipc("get_revenue_comparison", { workspaceId, yearCount });
}

export type ManualRevenueEntry = {
  id: string;
  workspaceId: string;
  year: number;
  month: number;
  amount: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ManualRevenueInput = {
  year: number;
  month: number;
  amount: number;
  currency?: string;
  notes?: string | null;
};

export async function listManualRevenueEntries(
  workspaceId: string,
): Promise<ManualRevenueEntry[]> {
  return ipc("list_manual_revenue_entries", { workspaceId });
}

export async function upsertManualRevenueEntry(
  workspaceId: string,
  input: ManualRevenueInput,
): Promise<ManualRevenueEntry> {
  return ipc("upsert_manual_revenue_entry", { workspaceId, input });
}

export async function deleteManualRevenueEntry(
  workspaceId: string,
  id: string,
): Promise<void> {
  return ipc("delete_manual_revenue_entry", { workspaceId, id });
}

export async function dataExportString(json: string): Promise<string> {
  return ipc("data_export_string", { json });
}

export async function dataImportString(encoded: string): Promise<string> {
  return ipc("data_import_string", { encoded });
}

export async function logImportHistory(
  workspaceId: string,
  sourceType: string,
  module: string,
  fileName: string | null,
  recordCount: number,
  status: string,
): Promise<void> {
  return ipc("log_import_history", {
    workspaceId,
    sourceType,
    module,
    fileName,
    recordCount,
    status,
  });
}

export type ImportHistoryRow = {
  id: string;
  workspaceId: string;
  sourceType: string;
  module: string;
  fileName: string | null;
  recordCount: number;
  status: string;
  createdAt: string;
};

export async function listImportHistory(
  workspaceId: string,
): Promise<ImportHistoryRow[]> {
  return ipc("list_import_history", { workspaceId });
}

export type PluginRow = {
  id: string;
  workspaceId: string;
  manifestJson: string;
  enabled: boolean;
};

export async function listPlugins(
  workspaceId: string,
): Promise<PluginRow[]> {
  return ipc("list_plugins", { workspaceId });
}

export async function registerPluginManifest(
  workspaceId: string,
  manifestJson: string,
): Promise<PluginRow> {
  return ipc("register_plugin_manifest", { workspaceId, manifestJson });
}

export async function setPluginEnabled(
  pluginId: string,
  enabled: boolean,
): Promise<void> {
  return ipc("set_plugin_enabled", { pluginId, enabled });
}

export type TextSnippet = {
  id: string;
  workspaceId: string;
  name: string;
  body: string;
  createdAt: string;
};

export async function listTextSnippets(
  workspaceId: string,
): Promise<TextSnippet[]> {
  return ipc("list_text_snippets", { workspaceId });
}

export async function createTextSnippet(
  workspaceId: string,
  input: { name: string; body: string },
): Promise<TextSnippet> {
  return ipc("create_text_snippet", { workspaceId, input });
}

export async function updateTextSnippet(
  id: string,
  input: { name: string; body: string },
): Promise<TextSnippet> {
  return ipc("update_text_snippet", { id, input });
}

export async function deleteTextSnippet(id: string): Promise<void> {
  return ipc("delete_text_snippet", { id });
}
