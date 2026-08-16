import type { Project } from "@/lib/api";

export const PROJECT_STATUS_VALUES = [
  "draft",
  "active",
  "on_hold",
  "completed",
  "cancelled",
] as const;

export function projectStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "active":
      return "Actif";
    case "on_hold":
      return "En pause";
    case "completed":
      return "Terminé";
    case "cancelled":
      return "Annulé";
    default:
      return status;
  }
}

export function projectMatchesGlobalSearch(
  p: Project,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return true;
  const blob = [
    p.name,
    p.code ?? "",
    p.notes ?? "",
    projectStatusLabel(p.status),
  ]
    .join(" ")
    .toLowerCase();
  return blob.includes(normalizedQuery);
}

/** Options combobox : projets du client d’abord, puis les autres. */
export function orderedProjectComboboxOptions(
  projects: Project[],
  clientId: string,
): { value: string; label: string }[] {
  const cid = clientId.trim();
  const forClient = cid
    ? projects.filter((p) => p.clientId === cid)
    : [];
  const other = projects.filter((p) => !cid || p.clientId !== cid);
  const seen = new Set<string>();
  const out: { value: string; label: string }[] = [];
  for (const p of [...forClient, ...other]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const code = p.code?.trim();
    const suffix = code ? ` (${code})` : "";
    out.push({ value: p.id, label: `${p.name}${suffix}` });
  }
  return out;
}

export function documentKindLabel(kind: string): string {
  switch (kind) {
    case "quote":
      return "Devis";
    case "invoice":
      return "Facture";
    case "credit_note":
      return "Avoir";
    case "purchase_order":
      return "Bon de commande";
    default:
      return kind;
  }
}
