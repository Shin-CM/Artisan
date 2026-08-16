import * as api from "@/lib/api";
import type { ImportBatchResult } from "@/lib/importExportKinds";
import { importRecordsForWorkspace } from "@/lib/importExportKinds";
import {
  parseWorkspacePayload,
  WORKSPACE_MODULE_KINDS,
  type WorkspaceBundlePayload,
} from "@/lib/workspaceBundle";

/** Ordre d’import pour respecter les dépendances (catégories avant articles, etc.). */
const WORKSPACE_IMPORT_ORDER = [
  "categories",
  "tax-rates",
  "snippets",
  "discount-presets",
  "articles",
  "clients",
  "projects",
  "quotes",
  "invoices",
] as const satisfies readonly (typeof WORKSPACE_MODULE_KINDS)[number][];

export type WorkspaceImportSummary = {
  results: ImportBatchResult[];
  errors: string[];
};

export async function importWorkspaceBundle(
  workspaceId: string,
  payload: WorkspaceBundlePayload,
  options?: {
    /** Kinds à ignorer (décochés dans l’UI). */
    skipKinds?: Set<string>;
    sourceType?: string;
    fileName?: string | null;
  },
): Promise<WorkspaceImportSummary> {
  parseWorkspacePayload(payload);
  const skip = options?.skipKinds ?? new Set();
  const sourceType = options?.sourceType ?? "workspace";
  const fileName = options?.fileName ?? null;

  const results: ImportBatchResult[] = [];
  const errors: string[] = [];

  for (const kind of WORKSPACE_IMPORT_ORDER) {
    if (skip.has(kind)) continue;
    const mod = payload.modules[kind];
    if (!mod || !Array.isArray(mod.records) || mod.records.length === 0) {
      continue;
    }
    try {
      const { count, failed } = await importRecordsForWorkspace(
        workspaceId,
        kind,
        mod.records,
      );
      results.push({ module: kind, count, failed });
      const status = failed > 0 ? "partial" : "ok";
      await api.logImportHistory(
        workspaceId,
        sourceType,
        kind,
        fileName,
        count,
        status,
      );
    } catch (e) {
      const msg = String(e);
      errors.push(`${kind}: ${msg}`);
      await api.logImportHistory(
        workspaceId,
        sourceType,
        kind,
        fileName,
        0,
        "error",
      );
    }
  }

  return { results, errors };
}
