import type { Project, ProjectDocument, ProjectFinancialSummary } from "@/lib/api";
import { documentKindLabel } from "@/pages/projects/projectUtils";
import { projectWorkspaceDocumentPath } from "@/pages/projects/projectWorkspaceDocLinks";

export function docOpenPath(
  d: ProjectDocument,
  projectRouteId: string | null | undefined,
): string {
  if (projectRouteId?.trim()) {
    return projectWorkspaceDocumentPath(projectRouteId.trim(), d);
  }
  const id = encodeURIComponent(d.id);
  if (d.documentKind === "quote") return `/home/quotes?focus=${id}`;
  if (d.documentKind === "purchase_order") {
    return `/home/purchase-orders?focus=${id}`;
  }
  if (d.documentKind === "credit_note") {
    return `/home/credit-notes?focus=${id}`;
  }
  return `/home/invoices?focus=${id}`;
}

export function formatIsoDateShort(iso: string): string {
  const d = iso.slice(0, 10);
  return d.length === 10 ? d : iso;
}

type TimelineRow = { sortKey: string; line: string };

export function buildTimelineRows(
  project: Project,
  documents: ProjectDocument[],
): TimelineRow[] {
  const rows: TimelineRow[] = [];
  const push = (sortKey: string, line: string) => {
    rows.push({ sortKey, line });
  };
  push(project.createdAt, `Projet créé le ${formatIsoDateShort(project.createdAt)}`);
  if (project.updatedAt && project.updatedAt !== project.createdAt) {
    push(
      project.updatedAt,
      `Fiche mise à jour le ${formatIsoDateShort(project.updatedAt)}`,
    );
  }
  if (project.startDate?.trim()) {
    push(`${project.startDate}T00:00:00`, `Début prévu : ${project.startDate}`);
  }
  if (project.endDate?.trim()) {
    push(`${project.endDate}T00:00:00`, `Fin prévue : ${project.endDate}`);
  }
  for (const d of documents) {
    const kind = documentKindLabel(d.documentKind);
    const arch = d.archived ? " (archivé)" : "";
    push(
      d.issueDate,
      `${formatIsoDateShort(d.issueDate)} — ${kind} ${d.number}${arch}`,
    );
  }
  rows.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  return rows;
}

export function netInvoiced(summary: ProjectFinancialSummary): number {
  return summary.invoicedTotal - summary.creditNotesTotal;
}
