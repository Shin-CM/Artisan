import * as api from "@/lib/api";
import type { Workspace, Client } from "@/lib/api";
import {
  parseBranding,
  parseDocumentLayout,
  type BrandingState,
  type DocumentLayoutState,
} from "@/lib/documentOptions";
import { isPdfTypographyEnabled } from "@/lib/marketplaceModules";
import type { PdfCommonContext } from "@/lib/pdfExport";

export async function loadPdfCommonContext(
  active: Workspace,
  clients: Client[],
  clientId: string | null,
  options?: {
    projectId?: string | null;
    projectsModuleEnabled?: boolean;
  },
): Promise<PdfCommonContext> {
  /** Profil à jour (branding / police PDF) : le workspace du contexte React peut être périmé. */
  const w = await api.getWorkspace(active.id);
  const branding = parseBranding(w.profileJson);
  const layout = parseDocumentLayout(w.profileJson);
  const plugins = await api.listPlugins(w.id);
  const pdfTypographyModuleActive = isPdfTypographyEnabled(plugins);
  let logoDataUrl: string | null = null;
  if (branding.logoRelativePath.trim()) {
    logoDataUrl = await api.readWorkspaceAssetBase64(
      w.id,
      branding.logoRelativePath.trim(),
    );
  }
  const client = clientId
    ? (clients.find((c) => c.id === clientId) ?? null)
    : null;

  let projectPdfLabel: string | null = null;
  const pid = options?.projectId?.trim();
  if (options?.projectsModuleEnabled && layout.showProjectOnPdf && pid) {
    try {
      const p = await api.getProject(pid);
      const code = p.code?.trim();
      projectPdfLabel = code ? `${code} — ${p.name}` : p.name;
    } catch {
      projectPdfLabel = null;
    }
  }

  return {
    workspaceId: w.id,
    workspaceName: w.name,
    branding,
    layout,
    logoDataUrl,
    client,
    pdfTypographyModuleActive,
    projectPdfLabel,
  };
}

export type { BrandingState, DocumentLayoutState, PdfCommonContext };
