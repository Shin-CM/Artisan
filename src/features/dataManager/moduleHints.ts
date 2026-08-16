export const MODULE_HINTS: Record<string, string> = {
  workspace:
    "Import/export global : un seul fichier JSON ou chaîne v1: pour plusieurs jeux de données ; cochez les lignes dans l’arborescence pour filtrer l’export.",
  clients: "Fiches clients importables/exportables (nom, courriel ; champs étendus en export v1).",
  categories: "Arborescence des dossiers catalogue (id, parent, nom, ordre).",
  "articles:all": "Tous les articles du catalogue pour cet espace.",
  "articles:uncat": "Articles sans dossier catalogue.",
  quotes: "Devis complets (lignes, compléments, totaux). Import : nouveaux brouillons ; références en conflit ignorées pour la ligne.",
  invoices: "Factures complètes. Le lien devis est effacé à l’import. Références personnalisées en double : enregistrement ignoré.",
  projects:
    "Projets (id, client, code, statut, budget…). Import avant devis/factures pour conserver les liens `project_id` des paquets complets.",
  "tax-rates": "Référentiel des taux de TVA.",
  "discount-presets": "Modèles de remise document.",
  snippets: "Textes enregistrés (compléments, modèles).",
  history: "Journal des opérations d’import/export.",
};

export function hintForSelection(selectionId: string): string {
  if (selectionId.startsWith("articles:cat:")) {
    return "Articles du dossier sélectionné uniquement.";
  }
  return MODULE_HINTS[selectionId] ?? MODULE_HINTS.clients;
}

const TITLES: Record<string, string> = {
  workspace: "Vue globale",
  clients: "Clients",
  categories: "Catégories (données)",
  "articles:all": "Tous les articles",
  "articles:uncat": "Sans catégorie",
  quotes: "Devis",
  invoices: "Factures",
  projects: "Projets",
  "tax-rates": "Taux TVA",
  "discount-presets": "Modèles de réduction",
  snippets: "Textes enregistrés",
  history: "Historique",
};

export function titleForSelection(
  selectionId: string,
  categoryNameById?: Map<string, string>,
): string {
  if (selectionId.startsWith("articles:cat:")) {
    const id = selectionId.slice("articles:cat:".length);
    const name = categoryNameById?.get(id);
    return name ? `Articles · ${name}` : "Articles (dossier)";
  }
  return TITLES[selectionId] ?? selectionId;
}
