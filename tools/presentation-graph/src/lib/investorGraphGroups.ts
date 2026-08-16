/** Domaines métier pour la coloration du graphe Présentation. */
export type InvestorGroup =
  | "plateforme"
  | "navigation"
  | "activite"
  | "bases"
  | "documents"
  | "agenda"
  | "extensions"
  | "donnees"
  | "compte"
  | "mobile";

export const INVESTOR_GROUPS: InvestorGroup[] = [
  "plateforme",
  "navigation",
  "activite",
  "bases",
  "documents",
  "agenda",
  "extensions",
  "donnees",
  "compte",
  "mobile",
];

export function isInvestorGroup(v: string): v is InvestorGroup {
  return (INVESTOR_GROUPS as string[]).includes(v);
}

/** Couleur bordure / accent (hex) + libellé court pour légende éventuelle. */
export const GROUP_PRESENTATION: Record<
  InvestorGroup,
  { stroke: string; label: string }
> = {
  plateforme: { stroke: "#64748b", label: "Plateforme" },
  navigation: { stroke: "#38bdf8", label: "Navigation" },
  activite: { stroke: "#34d399", label: "Accueil & rapports" },
  bases: { stroke: "#a78bfa", label: "Bases de données" },
  documents: { stroke: "#f472b6", label: "Documents" },
  agenda: { stroke: "#fb923c", label: "Calendrier" },
  extensions: { stroke: "#818cf8", label: "Marketplace" },
  donnees: { stroke: "#2dd4bf", label: "Data Manager" },
  compte: { stroke: "#e5c07b", label: "Paramètres & facturation" },
  mobile: { stroke: "#94c5f8", label: "Mobile & web" },
};

export function neighborIdsForNode(
  focusId: string,
  edges: { source: string; target: string }[],
): Set<string> {
  const s = new Set<string>([focusId]);
  for (const e of edges) {
    if (e.source === focusId) s.add(e.target);
    if (e.target === focusId) s.add(e.source);
  }
  return s;
}
