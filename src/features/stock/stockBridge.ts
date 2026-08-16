/**
 * Contrat Stock V2 — solutions Marketplace partageant le noyau mouvements / niveaux.
 * Libellés volontairement généralistes (pas de secteur d’activité cible).
 */

export const STOCK_CORE_PLAN_VERSION = 2 as const;

/** Identifiant du module unifié (quantités, mouvements, seuils, alertes). */
export const STOCK_MANAGER_MANIFEST_ID = "invoicies.stock-manager" as const;

/** Identifiants manifeste (`plugin_registry`). */
export type StockSolutionManifestId =
  | typeof STOCK_MANAGER_MANIFEST_ID
  | "invoicies.stock-locations"
  | "invoicies.stock-documents"
  | "invoicies.stock-inventory-count"
  | "invoicies.stock-valuation";

/** Modèle de quantité : une seule solution active à la fois (migration explicite si changement). */
export const STOCK_QUANTITY_MODEL_SOLUTIONS: readonly StockSolutionManifestId[] = [
  STOCK_MANAGER_MANIFEST_ID,
  "invoicies.stock-locations",
] as const;

/** Extensions cumulables au-dessus du module Stock Manager. */
export const STOCK_ADDON_SOLUTIONS: readonly StockSolutionManifestId[] = [
  "invoicies.stock-documents",
  "invoicies.stock-inventory-count",
  "invoicies.stock-valuation",
] as const;

export type StockSolutionRoadmapEntry = {
  manifestId: StockSolutionManifestId;
  displayName: string;
  summary: string;
  detail: string;
  /** Prochaine vague produit (indicatif). */
  waveLabel: string;
};

export const STOCK_SOLUTION_ROADMAP: readonly StockSolutionRoadmapEntry[] = [
  {
    manifestId: "invoicies.stock-locations",
    displayName: "Emplacements & transferts",
    summary:
      "Plusieurs emplacements de stockage, quantités par emplacement et transferts entre emplacements.",
    detail:
      "Chaque article peut être réparti sur plusieurs emplacements nommés. Les transferts sont tracés comme des mouvements dédiés. Une vue synthèse agrège les quantités par article.",
    waveLabel: "V2.2",
  },
  {
    manifestId: "invoicies.stock-documents",
    displayName: "Stock lié aux documents",
    summary:
      "Mouvements automatiques ou guidés à partir des factures et des bons de commande.",
    detail:
      "Paramètres par espace pour déclencher les sorties ou entrées selon le statut des documents. Les avoirs peuvent générer des entrées miroir lorsque le module correspondant est actif.",
    waveLabel: "V2.1",
  },
  {
    manifestId: "invoicies.stock-inventory-count",
    displayName: "Inventaire physique",
    summary:
      "Sessions de comptage avec écarts et ajustements groupés à la validation.",
    detail:
      "Création d’une session (brouillon), saisie des quantités comptées par article ou par filtre de catalogue, puis validation qui enregistre les écarts en ajustements.",
    waveLabel: "V2.3",
  },
  {
    manifestId: "invoicies.stock-valuation",
    displayName: "Valorisation & coût",
    summary:
      "Valeur de stock et indicateurs de rotation (hors comptabilité complète).",
    detail:
      "Méthodes de valorisation configurables par espace (coût moyen, dernier entré). Rapports dédiés, distincts du module Comptabilité Essentials.",
    waveLabel: "V2.4",
  },
] as const;
