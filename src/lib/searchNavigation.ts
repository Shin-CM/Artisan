/**
 * Navigation rapide depuis la barre de recherche (Entrée ou clic sur une suggestion).
 */

export type SearchNavMatch = {
  path: string;
  /** Libellé affiché dans les suggestions */
  label: string;
  /** Score de pertinence (plus haut = meilleur) */
  score: number;
};

type NavTarget = {
  path: string;
  label: string;
  /** Termes français / anglais (recherche insensible à la casse et aux accents) */
  terms: string[];
};

function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function normalizeSearchNavQuery(raw: string): string {
  return stripDiacritics(raw.trim());
}

/** Pages où la requête globale sert encore à filtrer le contenu : on la conserve après navigation. */
export function shouldPreserveSearchQueryAfterNav(path: string): boolean {
  return (
    path.startsWith("/home/quotes") ||
    path.startsWith("/home/purchase-orders") ||
    path.startsWith("/home/invoices") ||
    path.startsWith("/home/credit-notes") ||
    path.startsWith("/home/crm") ||
    path.startsWith("/home/recovery") ||
    path.startsWith("/home/client-followup") ||
    path.startsWith("/home/projects") ||
    path.startsWith("/database/clients") ||
    path.startsWith("/database/products") ||
    path.startsWith("/database/history") ||
    path.startsWith("/database/stock") ||
    path.startsWith("/database/client-followup") ||
    path.startsWith("/home/stock")
  );
}

const NAV_TARGETS: NavTarget[] = [
  {
    path: "/home/dashboard",
    label: "Accueil — Tableau de bord",
    terms: [
      "accueil",
      "tableau de bord",
      "tableau bord",
      "dashboard",
      "kpi",
      "statistiques",
      "stats",
    ],
  },
  {
    path: "/calendar",
    label: "Calendrier",
    terms: [
      "calendrier",
      "calendar",
      "agenda",
      "evenement",
      "événement",
      "evenements",
      "événements",
      "echeance",
      "échéance",
      "echeances",
      "échéances",
      "rappel",
      "rappels",
      "planning",
    ],
  },
  {
    path: "/home/quotes",
    label: "Devis",
    terms: ["devis", "quote", "quotes", "proposition", "estimatif"],
  },
  {
    path: "/home/purchase-orders",
    label: "Bons de commande",
    terms: [
      "bon de commande",
      "bons de commande",
      "purchase order",
      "commande",
    ],
  },
  {
    path: "/home/invoices",
    label: "Factures",
    terms: ["facture", "factures", "invoice", "invoices"],
  },
  {
    path: "/home/credit-notes",
    label: "Avoirs",
    terms: ["avoir", "avoirs", "credit note", "note de crédit"],
  },
  {
    path: "/home/crm",
    label: "Pipeline CRM",
    terms: ["crm", "pipeline", "kanban", "opportunite", "opportunité", "commercial"],
  },
  {
    path: "/home/recovery",
    label: "Recouvrement",
    terms: [
      "recouvrement",
      "impaye",
      "impayé",
      "impayés",
      "relance",
      "relances",
      "retard",
    ],
  },
  {
    path: "/home/client-followup",
    label: "Suivi clients",
    terms: [
      "suivi",
      "relance",
      "relances",
      "client dormant",
      "dormant",
      "priorité",
    ],
  },
  {
    path: "/database/client-followup",
    label: "Bases — Données suivi clients",
    terms: [
      "bases suivi",
      "tags suivi",
      "rappels suivi",
      "données suivi",
      "suivi clients données",
      "relance",
    ],
  },
  {
    path: "/home/reports",
    label: "Rapports",
    terms: ["rapport", "rapports", "report", "reports", "export"],
  },
  {
    path: "/home/projects",
    label: "Projets",
    terms: [
      "projet",
      "projets",
      "chantier",
      "affaire",
      "mission",
      "project",
    ],
  },
  {
    path: "/database/clients",
    label: "Bases — Clients",
    terms: [
      "client",
      "clients",
      "fiche client",
      "annuaire",
      "carnet",
      "base clients",
    ],
  },
  {
    path: "/database/products",
    label: "Bases — Produits",
    terms: [
      "produit",
      "produits",
      "article",
      "articles",
      "catalogue",
      "base produits",
    ],
  },
  {
    path: "/home/stock",
    label: "Accueil — Stock",
    terms: [
      "stock",
      "inventaire",
      "mouvement",
      "mouvements",
      "entree",
      "entrée",
      "sortie",
      "ajustement",
      "niveau",
      "quantite",
      "quantité",
    ],
  },
  {
    path: "/database/history",
    label: "Bases — Historique",
    terms: [
      "historique",
      "archive",
      "archives",
      "ca manuel",
      "chiffre affaires manuel",
    ],
  },
  {
    path: "/settings/workspace",
    label: "Paramètres — Espace de travail",
    terms: [
      "parametres",
      "paramètres",
      "reglages",
      "réglages",
      "settings",
      "espace de travail",
      "espace travail",
      "workspace",
      "siret",
      "identite",
      "identité",
      "ville",
      "devise",
    ],
  },
  {
    path: "/settings/branding",
    label: "Paramètres — Branding",
    terms: [
      "branding",
      "logo",
      "slogan",
      "titre",
      "police pdf",
      "apparence",
      "charte",
    ],
  },
  {
    path: "/settings/template",
    label: "Paramètres — Mise en page PDF",
    terms: [
      "mise en page",
      "mise en page pdf",
      "template pdf",
      "modele pdf",
      "modèle pdf",
      "pdf",
      "textes enregistres",
      "textes enregistrés",
      "snippets",
      "variante pdf",
    ],
  },
  {
    path: "/settings/calendar",
    label: "Paramètres — Calendrier (fériés CH)",
    terms: [
      "calendrier",
      "feries",
      "fériés",
      "vacances scolaires",
      "openholidays",
      "suisse",
      "canton",
      "vacances france",
      "zone a",
      "zone b",
      "zone c",
      "synchronisation calendrier",
      "jours feries",
    ],
  },
  {
    path: "/settings/client-followup-apps",
    label: "Paramètres — Suivi clients (applications)",
    terms: [
      "suivi clients",
      "suivi client",
      "mailto",
      "tel",
      "courriel",
      "telephone",
      "téléphone",
      "mail",
      "facetime",
      "outlook",
      "thunderbird",
      "applications contact",
    ],
  },
  {
    path: "/marketplace",
    label: "Marketplace",
    terms: [
      "marketplace",
      "extensions",
      "plugins",
      "integrations",
      "intégrations",
      "decouvrir",
      "découvrir",
      "polices",
      "typographie",
    ],
  },
  {
    path: "/marketplace/documents",
    label: "Marketplace — Documents métier",
    terms: [
      "marketplace document",
      "bon de commande marketplace",
      "avoir marketplace",
      "extensions documents",
    ],
  },
  {
    path: "/marketplace/donnees",
    label: "Marketplace — Données & bases",
    terms: [
      "data manager marketplace",
      "chargement a la demande",
      "marketplace donnees",
      "marketplace données",
    ],
  },
  {
    path: "/marketplace/clients",
    label: "Marketplace — Clients & encaissements",
    terms: [
      "marketplace crm",
      "marketplace recouvrement",
      "pipeline marketplace",
      "extension crm",
    ],
  },
  {
    path: "/marketplace/integrations",
    label: "Marketplace — Intégrations",
    terms: [
      "integration",
      "intégration",
      "connecteur",
      "api tablette",
      "tablette",
      "lan",
      "pwa tablette",
      "api locale",
    ],
  },
  {
    path: "/marketplace/reports",
    label: "Marketplace — Rapports & exports",
    terms: ["marketplace rapport", "export marketplace"],
  },
  {
    path: "/marketplace/polices",
    label: "Marketplace — Polices & typographie PDF",
    terms: [
      "police",
      "polices",
      "font",
      "fonts",
      "typographie",
      "typography",
      "pdf typo",
    ],
  },
  {
    path: "/marketplace/sur-mesure",
    label: "Marketplace — Sur mesure",
    terms: ["sur mesure", "custom", "personnalisation"],
  },
  {
    path: "/marketplace/crm",
    label: "Marketplace — CRM (feuille de route)",
    terms: ["crm", "kanban", "opportunite", "opportunité", "pipeline"],
  },
  {
    path: "/marketplace/accounting-essentials",
    label: "Marketplace — Comptabilité Essentials (feuille de route)",
    terms: ["comptabilite", "comptabilité", "export comptable", "grand livre"],
  },
  {
    path: "/marketplace/stocks-projects",
    label: "Marketplace — Stocks / Projets (feuille de route)",
    terms: ["stock", "stocks", "projet", "temps facturable"],
  },
  {
    path: "/marketplace/platform-roadmap",
    label: "Marketplace — Plateforme Vague 3",
    terms: ["api publique", "web", "mobile", "banque", "facturation electronique"],
  },
];

function scoreForTerm(queryNorm: string, termNorm: string): number {
  if (!queryNorm || !termNorm) return 0;
  if (queryNorm === termNorm) return 120 + termNorm.length;
  if (termNorm.startsWith(queryNorm)) return 80 + queryNorm.length;
  if (queryNorm.startsWith(termNorm)) return 70 + termNorm.length;
  if (termNorm.includes(queryNorm)) return 50 + Math.min(queryNorm.length, 20);
  if (queryNorm.includes(termNorm)) return 40 + termNorm.length;

  const qWords = queryNorm.split(/\s+/).filter(Boolean);
  if (qWords.length >= 2) {
    const allInTerm = qWords.every((w) => termNorm.includes(w));
    if (allInTerm) return 60 + queryNorm.length;
    const termWords = termNorm.split(/\s+/).filter(Boolean);
    const everyTermWordInQuery = termWords.every((w) => queryNorm.includes(w));
    if (everyTermWordInQuery && termWords.length >= 2) return 55 + termNorm.length;
  }
  return 0;
}

function bestScoreForTarget(queryNorm: string, target: NavTarget): number {
  let best = scoreForTerm(queryNorm, stripDiacritics(target.label));
  for (const t of target.terms) {
    best = Math.max(best, scoreForTerm(queryNorm, stripDiacritics(t)));
  }
  return best;
}

const MIN_QUERY_LEN = 2;

/**
 * Suggestions triées par pertinence (meilleur d’abord), max `limit` entrées.
 */
export function searchNavigationMatches(
  rawQuery: string,
  limit = 8,
): SearchNavMatch[] {
  const queryNorm = normalizeSearchNavQuery(rawQuery);
  if (queryNorm.length < MIN_QUERY_LEN) return [];

  const out: SearchNavMatch[] = [];
  for (const t of NAV_TARGETS) {
    const score = bestScoreForTarget(queryNorm, t);
    if (score > 0) {
      out.push({ path: t.path, label: t.label, score });
    }
  }
  out.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "fr"));
  return out.slice(0, limit);
}

