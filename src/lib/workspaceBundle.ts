/**
 * Paquet d’export/import multi-modules (un seul JSON, même transport v1: que les paquets mono-kind).
 */
import { exportKindForSelection } from "@/features/dataManager/resolveExportKind";
import {
  recordsForKindFromWorkspaceData,
  type GenericPayload,
} from "@/lib/importExportKinds";
import type { DataManagerBundle } from "@/features/dataManager/useDataManagerWorkspaceData";

export const WORKSPACE_BUNDLE_KIND = "invoicies.workspace" as const;

export const WORKSPACE_MODULE_KINDS = [
  "categories",
  "tax-rates",
  "snippets",
  "discount-presets",
  "articles",
  "clients",
  "projects",
  "quotes",
  "invoices",
] as const;

export type WorkspaceModuleKind = (typeof WORKSPACE_MODULE_KINDS)[number];

export type WorkspaceModulePayload = {
  kind: string;
  schemaVersion: number;
  records: unknown[];
};

export type WorkspaceBundlePayload = {
  schemaVersion: 2;
  bundleKind: typeof WORKSPACE_BUNDLE_KIND;
  createdAt: string;
  modules: Partial<Record<WorkspaceModuleKind, WorkspaceModulePayload>>;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function isWorkspaceBundlePayload(
  raw: unknown,
): raw is WorkspaceBundlePayload {
  if (!isRecord(raw)) return false;
  if (raw.bundleKind !== WORKSPACE_BUNDLE_KIND) return false;
  if (raw.schemaVersion !== 2) return false;
  if (typeof raw.createdAt !== "string") return false;
  if (!isRecord(raw.modules)) return false;
  for (const k of Object.keys(raw.modules)) {
    if (!WORKSPACE_MODULE_KINDS.includes(k as WorkspaceModuleKind)) return false;
    const mod = raw.modules[k];
    if (!isRecord(mod)) return false;
    if (typeof mod.kind !== "string") return false;
    if (mod.schemaVersion !== 1) return false;
    if (!Array.isArray(mod.records)) return false;
  }
  return true;
}

export function parseWorkspacePayload(raw: unknown): WorkspaceBundlePayload {
  if (!isWorkspaceBundlePayload(raw)) {
    throw new Error(
      "Paquet workspace invalide : attendu bundleKind invoicies.workspace, schemaVersion 2 et modules.",
    );
  }
  return raw;
}

function recordId(rec: unknown): string | null {
  if (!isRecord(rec)) return null;
  const id = rec.id;
  return typeof id === "string" ? id : null;
}

/** Regroupe les ids sélectionnés par kind d’export (scopes articles fusionnés). */
export function selectedIdsByExportKind(
  sidebarSelection: Map<string, Set<string>>,
): Map<string, Set<string>> {
  const byKind = new Map<string, Set<string>>();
  for (const [scope, ids] of sidebarSelection) {
    if (ids.size === 0) continue;
    const cfg = exportKindForSelection(scope);
    if (!cfg) continue;
    let set = byKind.get(cfg.kind);
    if (!set) {
      set = new Set<string>();
      byKind.set(cfg.kind, set);
    }
    for (const id of ids) set.add(id);
  }
  return byKind;
}

function bundleToRecordsData(
  bundle: DataManagerBundle,
): Parameters<typeof recordsForKindFromWorkspaceData>[1] {
  return {
    clients: bundle.clients,
    categories: bundle.categories,
    articles: bundle.articles,
    taxRates: bundle.taxRates,
    snippets: bundle.snippets,
    presets: bundle.presets,
    projects: bundle.projects,
    quotes: bundle.quotes,
    invoices: bundle.invoices,
  };
}

export function filterRecordsByIds(
  records: unknown[],
  ids: Set<string>,
): unknown[] {
  return records.filter((r) => {
    const id = recordId(r);
    return id !== null && ids.has(id);
  });
}

export type BuildWorkspaceExportOptions = {
  bundle: DataManagerBundle;
  sidebarSelection: Map<string, Set<string>>;
  /** Si true : pour chaque kind sans sélection sidebar, exporter tout le jeu ; sinon n’inclure que les kinds avec au moins une case cochée. */
  includeAllWhenNoSelection: boolean;
};

export function buildWorkspaceExportPayload(
  options: BuildWorkspaceExportOptions,
): WorkspaceBundlePayload {
  const { bundle, sidebarSelection, includeAllWhenNoSelection } = options;
  const byKind = selectedIdsByExportKind(sidebarSelection);
  const data = bundleToRecordsData(bundle);
  const modules: WorkspaceBundlePayload["modules"] = {};

  for (const kind of WORKSPACE_MODULE_KINDS) {
    const ids = byKind.get(kind);
    const allRecords = recordsForKindFromWorkspaceData(kind, {
      ...data,
      articleFilter: { mode: "all" },
    });
    let records: unknown[];
    if (ids && ids.size > 0) {
      records = filterRecordsByIds(allRecords, ids);
    } else if (includeAllWhenNoSelection) {
      records = allRecords;
    } else {
      continue;
    }
    if (records.length === 0) continue;
    modules[kind] = {
      kind,
      schemaVersion: 1,
      records,
    };
  }

  return {
    schemaVersion: 2,
    bundleKind: WORKSPACE_BUNDLE_KIND,
    createdAt: new Date().toISOString(),
    modules,
  };
}

/** Après décodage v1:, route vers workspace ou paquet mono-kind. */
export function isMonoKindPayload(raw: unknown): raw is GenericPayload {
  if (!isRecord(raw)) return false;
  if (raw.bundleKind === WORKSPACE_BUNDLE_KIND) return false;
  return typeof raw.kind === "string" && Array.isArray(raw.records);
}
