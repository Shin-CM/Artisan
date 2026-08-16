/**
 * Catalogue extensions Marketplace : ordre = ordre d’affichage
 * (1ʳᵉ entrée → 1ʳᵉ ligne, 2ᵉ → 2ᵉ ligne, …).
 */

export type MarketplaceCatalogExtensionId =
  | "pdf-typography"
  | "data-manager-lazy"
  | "stock-manager"
  | "document-purchase-orders"
  | "document-credit-notes"
  | "document-projects"
  | "crm-pipeline"
  | "recovery-assisted"
  | "client-followup"
  | "local-tablet-api";

export type MarketplaceExtensionShelfCategory =
  | "polices"
  | "donnees"
  | "stock"
  | "documents"
  | "clients"
  | "integrations";

export type MarketplaceCatalogEntry = {
  id: MarketplaceCatalogExtensionId;
  category: MarketplaceExtensionShelfCategory;
};

/** Ordre stable du catalogue (lignes successives). */
export const MARKETPLACE_EXTENSION_CATALOG: MarketplaceCatalogEntry[] = [
  { id: "pdf-typography", category: "polices" },
  { id: "data-manager-lazy", category: "donnees" },
  { id: "stock-manager", category: "stock" },
  { id: "document-purchase-orders", category: "documents" },
  { id: "document-credit-notes", category: "documents" },
  { id: "document-projects", category: "documents" },
  { id: "crm-pipeline", category: "clients" },
  { id: "recovery-assisted", category: "clients" },
  { id: "client-followup", category: "clients" },
  { id: "local-tablet-api", category: "integrations" },
];

export function marketplaceExtensionCatalogForDiscover(): MarketplaceCatalogEntry[] {
  return MARKETPLACE_EXTENSION_CATALOG;
}

export function marketplaceExtensionCatalogForPolices(): MarketplaceCatalogEntry[] {
  return MARKETPLACE_EXTENSION_CATALOG.filter((e) => e.category === "polices");
}

export function marketplaceExtensionCatalogForDonnees(): MarketplaceCatalogEntry[] {
  return MARKETPLACE_EXTENSION_CATALOG.filter((e) => e.category === "donnees");
}

export function marketplaceExtensionCatalogForStock(): MarketplaceCatalogEntry[] {
  return MARKETPLACE_EXTENSION_CATALOG.filter((e) => e.category === "stock");
}

export function marketplaceExtensionCatalogForDocuments(): MarketplaceCatalogEntry[] {
  return MARKETPLACE_EXTENSION_CATALOG.filter((e) => e.category === "documents");
}

export function marketplaceExtensionCatalogForClients(): MarketplaceCatalogEntry[] {
  return MARKETPLACE_EXTENSION_CATALOG.filter((e) => e.category === "clients");
}

export function marketplaceExtensionCatalogForIntegrations(): MarketplaceCatalogEntry[] {
  return MARKETPLACE_EXTENSION_CATALOG.filter(
    (e) => e.category === "integrations",
  );
}
