import type { ProjectDocument } from "@/lib/api";

/** Liens vers l’éditeur dans le shell projet (`/home/projects/:projectId/.../edit`). */
export function projectWorkspaceDocumentPath(
  projectId: string,
  d: ProjectDocument,
): string {
  const id = encodeURIComponent(d.id);
  if (d.documentKind === "quote") {
    return `/home/projects/${projectId}/quotes/edit?focus=${id}`;
  }
  if (d.documentKind === "purchase_order") {
    return `/home/projects/${projectId}/purchase-orders/edit?focus=${id}`;
  }
  if (d.documentKind === "credit_note") {
    return `/home/projects/${projectId}/invoices/edit?focus=${id}&docKind=credit_note`;
  }
  return `/home/projects/${projectId}/invoices/edit?focus=${id}`;
}
