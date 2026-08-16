import type { PluginRow } from "@/lib/api";
import {
  ACCOUNTING_BRIDGE_PLAN_VERSION,
  ACCOUNTING_ESSENTIALS_MANIFEST_STUB_V1,
  ACCOUNTING_ESSENTIALS_PLUGIN_ID,
} from "@/features/accounting/accountingBridge";
import { parseInternalManifest } from "@/plugins/pluginHost";

export {
  ACCOUNTING_BRIDGE_PLAN_VERSION,
  ACCOUNTING_ESSENTIALS_MANIFEST_STUB_V1,
  ACCOUNTING_ESSENTIALS_PLUGIN_ID,
};

/** Identifiant logique du manifeste (champ `id` JSON), stable pour toutes les lignes `plugin_registry`. */
export const PDF_TYPOGRAPHY_MODULE_ID = "invoicies.pdf-typography";

export const DATA_MANAGER_LAZY_MODULE_ID = "invoicies.data-manager-lazy-load";

/**
 * Bons de commande : écran dédié, navigation, conversion devis → BDC.
 * Actif uniquement si une ligne `plugin_registry` existe pour ce manifeste et `enabled = 1`.
 */
export const DOCUMENT_PURCHASE_ORDERS_MODULE_ID =
  "invoicies.document-purchase-orders";

/**
 * Avoirs : écran dédié, création d’avoir depuis une facture.
 * Actif uniquement si une ligne existe pour ce manifeste et `enabled = 1`.
 */
export const DOCUMENT_CREDIT_NOTES_MODULE_ID =
  "invoicies.document-credit-notes";

/** Projets : rattachement devis / factures / BDC (SQLite). Actif si ligne + `enabled`. */
export const DOCUMENT_PROJECTS_MODULE_ID = "invoicies.document-projects";

/** @deprecated Ancien id — migration vers `invoicies.stock-manager`. */
export const STOCK_SIMPLE_MODULE_ID = "invoicies.stock-simple";

/** @deprecated Ancien id — fusionné dans `invoicies.stock-manager`. */
export const STOCK_ALERTS_MODULE_ID = "invoicies.stock-alerts";

/** Stock : quantités, mouvements, seuils et alertes (SQLite). Actif si ligne + `enabled`. */
export const STOCK_MANAGER_MODULE_ID = "invoicies.stock-manager";

/** Kanban opportunités (SQLite). Actif si ligne `plugin_registry` + `enabled`. */
export const CRM_PIPELINE_MODULE_ID = "invoicies.crm-pipeline";

/** Relances impayés, modèles, échéancier (UI). Actif si ligne + `enabled`. */
export const RECOVERY_ASSISTED_MODULE_ID = "invoicies.recovery-assisted";

/** Suivi client, score de relance, timeline et rappels. Actif si ligne + `enabled`. */
export const CLIENT_FOLLOWUP_MODULE_ID = "invoicies.client-followup";

/** API HTTP locale pour la PWA tablette (LAN). Actif si ligne `plugin_registry` + `enabled`. */
export const LOCAL_TABLET_API_MODULE_ID = "invoicies.local-tablet-api";

export const DOCUMENT_PURCHASE_ORDERS_MODULE_META = {
  id: DOCUMENT_PURCHASE_ORDERS_MODULE_ID,
  displayName: "Bons de commande",
  version: "1.0.0",
  capabilities: ["purchase_orders"] as const,
} as const;

export const DOCUMENT_CREDIT_NOTES_MODULE_META = {
  id: DOCUMENT_CREDIT_NOTES_MODULE_ID,
  displayName: "Avoirs",
  version: "1.0.0",
  capabilities: ["credit_notes"] as const,
} as const;

export const DOCUMENT_PROJECTS_MODULE_META = {
  id: DOCUMENT_PROJECTS_MODULE_ID,
  displayName: "Projets",
  version: "1.0.0",
  capabilities: ["document_projects"] as const,
} as const;

export const STOCK_MANAGER_MODULE_META = {
  id: STOCK_MANAGER_MODULE_ID,
  displayName: "Stock Manager",
  version: "2.0.0",
  capabilities: ["stock_manager"] as const,
} as const;

export const DOCUMENT_PURCHASE_ORDERS_MODULE_ANCHOR =
  "module-document-purchase-orders";

export const DOCUMENT_CREDIT_NOTES_MODULE_ANCHOR =
  "module-document-credit-notes";

export const DOCUMENT_PROJECTS_MODULE_ANCHOR = "module-document-projects";

export const STOCK_MANAGER_MODULE_ANCHOR = "module-stock-manager";

export const CRM_PIPELINE_MODULE_META = {
  id: CRM_PIPELINE_MODULE_ID,
  displayName: "Pipeline CRM",
  version: "1.0.0",
  capabilities: ["crm_pipeline"] as const,
} as const;

export const RECOVERY_ASSISTED_MODULE_META = {
  id: RECOVERY_ASSISTED_MODULE_ID,
  displayName: "Recouvrement",
  version: "1.0.0",
  capabilities: ["recovery_assisted"] as const,
} as const;

export const CLIENT_FOLLOWUP_MODULE_META = {
  id: CLIENT_FOLLOWUP_MODULE_ID,
  displayName: "Suivi & relance clients",
  version: "1.0.0",
  capabilities: ["client_followup"] as const,
} as const;

export const CRM_PIPELINE_MODULE_ANCHOR = "module-crm-pipeline";

export const RECOVERY_ASSISTED_MODULE_ANCHOR = "module-recovery-assisted";

export const CLIENT_FOLLOWUP_MODULE_ANCHOR = "module-client-followup";

export const LOCAL_TABLET_API_MODULE_META = {
  id: LOCAL_TABLET_API_MODULE_ID,
  displayName: "API tablette (réseau local)",
  version: "0.1.0",
  capabilities: ["local_tablet_api"] as const,
} as const;

export const LOCAL_TABLET_API_MODULE_ANCHOR = "module-local-tablet-api";

/** Métadonnées affichées Marketplace (alignées sur le JSON du manifeste). */
export const PDF_TYPOGRAPHY_MODULE_META = {
  id: PDF_TYPOGRAPHY_MODULE_ID,
  displayName: "Typographie PDF (par blocs)",
  version: "1.0.0",
  capabilities: ["pdf_typography"] as const,
} as const;

export const DATA_MANAGER_LAZY_MODULE_META = {
  id: DATA_MANAGER_LAZY_MODULE_ID,
  displayName: "Data Manager — chargement à la demande",
  version: "1.0.0",
  capabilities: ["data_manager_lazy_fetch"] as const,
} as const;

/** Ancre HTML pour liens directs (`#module-pdf-typography`). */
export const PDF_TYPOGRAPHY_MODULE_ANCHOR = "module-pdf-typography";

export const DATA_MANAGER_LAZY_MODULE_ANCHOR = "module-data-manager-lazy";

export function pdfTypographyManifestJson(): string {
  return JSON.stringify({
    id: PDF_TYPOGRAPHY_MODULE_META.id,
    name: PDF_TYPOGRAPHY_MODULE_META.displayName,
    version: PDF_TYPOGRAPHY_MODULE_META.version,
    capabilities: [...PDF_TYPOGRAPHY_MODULE_META.capabilities],
  });
}

export function dataManagerLazyManifestJson(): string {
  return JSON.stringify({
    id: DATA_MANAGER_LAZY_MODULE_META.id,
    name: DATA_MANAGER_LAZY_MODULE_META.displayName,
    version: DATA_MANAGER_LAZY_MODULE_META.version,
    capabilities: [...DATA_MANAGER_LAZY_MODULE_META.capabilities],
  });
}

export function documentPurchaseOrdersManifestJson(): string {
  return JSON.stringify({
    id: DOCUMENT_PURCHASE_ORDERS_MODULE_META.id,
    name: DOCUMENT_PURCHASE_ORDERS_MODULE_META.displayName,
    version: DOCUMENT_PURCHASE_ORDERS_MODULE_META.version,
    capabilities: [...DOCUMENT_PURCHASE_ORDERS_MODULE_META.capabilities],
  });
}

export function documentCreditNotesManifestJson(): string {
  return JSON.stringify({
    id: DOCUMENT_CREDIT_NOTES_MODULE_META.id,
    name: DOCUMENT_CREDIT_NOTES_MODULE_META.displayName,
    version: DOCUMENT_CREDIT_NOTES_MODULE_META.version,
    capabilities: [...DOCUMENT_CREDIT_NOTES_MODULE_META.capabilities],
  });
}

export function documentProjectsManifestJson(): string {
  return JSON.stringify({
    id: DOCUMENT_PROJECTS_MODULE_META.id,
    name: DOCUMENT_PROJECTS_MODULE_META.displayName,
    version: DOCUMENT_PROJECTS_MODULE_META.version,
    capabilities: [...DOCUMENT_PROJECTS_MODULE_META.capabilities],
  });
}

export function stockManagerManifestJson(): string {
  return JSON.stringify({
    id: STOCK_MANAGER_MODULE_META.id,
    name: STOCK_MANAGER_MODULE_META.displayName,
    version: STOCK_MANAGER_MODULE_META.version,
    capabilities: [...STOCK_MANAGER_MODULE_META.capabilities],
  });
}

export function crmPipelineManifestJson(): string {
  return JSON.stringify({
    id: CRM_PIPELINE_MODULE_META.id,
    name: CRM_PIPELINE_MODULE_META.displayName,
    version: CRM_PIPELINE_MODULE_META.version,
    capabilities: [...CRM_PIPELINE_MODULE_META.capabilities],
  });
}

export function recoveryAssistedManifestJson(): string {
  return JSON.stringify({
    id: RECOVERY_ASSISTED_MODULE_META.id,
    name: RECOVERY_ASSISTED_MODULE_META.displayName,
    version: RECOVERY_ASSISTED_MODULE_META.version,
    capabilities: [...RECOVERY_ASSISTED_MODULE_META.capabilities],
  });
}

export function clientFollowupManifestJson(): string {
  return JSON.stringify({
    id: CLIENT_FOLLOWUP_MODULE_META.id,
    name: CLIENT_FOLLOWUP_MODULE_META.displayName,
    version: CLIENT_FOLLOWUP_MODULE_META.version,
    capabilities: [...CLIENT_FOLLOWUP_MODULE_META.capabilities],
  });
}

export function localTabletApiManifestJson(): string {
  return JSON.stringify({
    id: LOCAL_TABLET_API_MODULE_META.id,
    name: LOCAL_TABLET_API_MODULE_META.displayName,
    version: LOCAL_TABLET_API_MODULE_META.version,
    capabilities: [...LOCAL_TABLET_API_MODULE_META.capabilities],
  });
}

export function findPdfTypographyPlugin(
  plugins: PluginRow[],
): PluginRow | null {
  for (const p of plugins) {
    const m = parseInternalManifest(p.manifestJson);
    if (m?.id === PDF_TYPOGRAPHY_MODULE_ID) return p;
  }
  return null;
}

export function isPdfTypographyEnabled(plugins: PluginRow[]): boolean {
  const p = findPdfTypographyPlugin(plugins);
  return p !== null && p.enabled;
}

export function findDataManagerLazyPlugin(plugins: PluginRow[]): PluginRow | null {
  for (const p of plugins) {
    const m = parseInternalManifest(p.manifestJson);
    if (m?.id === DATA_MANAGER_LAZY_MODULE_ID) return p;
  }
  return null;
}

export function isDataManagerLazyLoadEnabled(plugins: PluginRow[]): boolean {
  const p = findDataManagerLazyPlugin(plugins);
  return p !== null && p.enabled;
}

function findPluginByManifestId(
  plugins: PluginRow[],
  manifestId: string,
): PluginRow | null {
  for (const p of plugins) {
    const m = parseInternalManifest(p.manifestJson);
    if (m?.id === manifestId) return p;
  }
  return null;
}

/**
 * Conversion / menus liés au module BDC : disponibles seulement après activation Marketplace
 * (ligne `plugin_registry` présente et `enabled`).
 */
export function isDocumentPurchaseOrdersConversionAvailable(
  plugins: PluginRow[],
): boolean {
  const p = findPluginByManifestId(plugins, DOCUMENT_PURCHASE_ORDERS_MODULE_ID);
  return p !== null && p.enabled;
}

export function isDocumentCreditNotesConversionAvailable(
  plugins: PluginRow[],
): boolean {
  const p = findPluginByManifestId(plugins, DOCUMENT_CREDIT_NOTES_MODULE_ID);
  return p !== null && p.enabled;
}

export function findDocumentPurchaseOrdersPlugin(
  plugins: PluginRow[],
): PluginRow | null {
  return findPluginByManifestId(plugins, DOCUMENT_PURCHASE_ORDERS_MODULE_ID);
}

export function findDocumentCreditNotesPlugin(
  plugins: PluginRow[],
): PluginRow | null {
  return findPluginByManifestId(plugins, DOCUMENT_CREDIT_NOTES_MODULE_ID);
}

export function findDocumentProjectsPlugin(
  plugins: PluginRow[],
): PluginRow | null {
  return findPluginByManifestId(plugins, DOCUMENT_PROJECTS_MODULE_ID);
}

export function findStockManagerPlugin(plugins: PluginRow[]): PluginRow | null {
  return findPluginByManifestId(plugins, STOCK_MANAGER_MODULE_ID);
}

function legacyStockPluginEnabled(
  plugins: PluginRow[],
  manifestId: string,
): boolean {
  const p = findPluginByManifestId(plugins, manifestId);
  return p !== null && p.enabled;
}

export function findCrmPipelinePlugin(plugins: PluginRow[]): PluginRow | null {
  return findPluginByManifestId(plugins, CRM_PIPELINE_MODULE_ID);
}

export function isCrmPipelineEnabledForWorkspace(plugins: PluginRow[]): boolean {
  const p = findCrmPipelinePlugin(plugins);
  return p !== null && p.enabled;
}

export function findRecoveryAssistedPlugin(
  plugins: PluginRow[],
): PluginRow | null {
  return findPluginByManifestId(plugins, RECOVERY_ASSISTED_MODULE_ID);
}

export function isRecoveryAssistedEnabledForWorkspace(
  plugins: PluginRow[],
): boolean {
  const p = findRecoveryAssistedPlugin(plugins);
  return p !== null && p.enabled;
}

export function findClientFollowupPlugin(
  plugins: PluginRow[],
): PluginRow | null {
  return findPluginByManifestId(plugins, CLIENT_FOLLOWUP_MODULE_ID);
}

export function isClientFollowupEnabledForWorkspace(
  plugins: PluginRow[],
): boolean {
  const p = findClientFollowupPlugin(plugins);
  return p !== null && p.enabled;
}

export function findLocalTabletApiPlugin(
  plugins: PluginRow[],
): PluginRow | null {
  return findPluginByManifestId(plugins, LOCAL_TABLET_API_MODULE_ID);
}

export function isLocalTabletApiEnabledForWorkspace(
  plugins: PluginRow[],
): boolean {
  const p = findLocalTabletApiPlugin(plugins);
  return p !== null && p.enabled;
}

/** Alias lisible pour l’UI (navigation, pages). */
export function isPurchaseOrdersModuleEnabledForWorkspace(
  plugins: PluginRow[],
): boolean {
  return isDocumentPurchaseOrdersConversionAvailable(plugins);
}

export function isCreditNotesModuleEnabledForWorkspace(
  plugins: PluginRow[],
): boolean {
  return isDocumentCreditNotesConversionAvailable(plugins);
}

export function isProjectsModuleEnabledForWorkspace(
  plugins: PluginRow[],
): boolean {
  const p = findDocumentProjectsPlugin(plugins);
  return p !== null && p.enabled;
}

/** Module Stock Manager actif (ou anciens modules stock encore présents en base). */
export function isStockManagerModuleEnabledForWorkspace(
  plugins: PluginRow[],
): boolean {
  const p = findStockManagerPlugin(plugins);
  if (p !== null && p.enabled) return true;
  return (
    legacyStockPluginEnabled(plugins, STOCK_SIMPLE_MODULE_ID) ||
    legacyStockPluginEnabled(plugins, STOCK_ALERTS_MODULE_ID)
  );
}

/** Lien vers la fiche module (onglet Données). */
export const MARKETPLACE_ROUTE_DATA_MANAGER_LAZY =
  `/marketplace/donnees#${DATA_MANAGER_LAZY_MODULE_ANCHOR}` as const;

/** Lien vers la fiche module (onglet Polices & typographie). */
export const MARKETPLACE_ROUTE_PDF_TYPOGRAPHY =
  `/marketplace/polices#${PDF_TYPOGRAPHY_MODULE_ANCHOR}` as const;

export const MARKETPLACE_ROUTE_DOCUMENT_PURCHASE_ORDERS =
  `/marketplace/documents#${DOCUMENT_PURCHASE_ORDERS_MODULE_ANCHOR}` as const;

export const MARKETPLACE_ROUTE_DOCUMENT_CREDIT_NOTES =
  `/marketplace/documents#${DOCUMENT_CREDIT_NOTES_MODULE_ANCHOR}` as const;

export const MARKETPLACE_ROUTE_DOCUMENT_PROJECTS =
  `/marketplace/documents#${DOCUMENT_PROJECTS_MODULE_ANCHOR}` as const;

export const MARKETPLACE_ROUTE_STOCK_HUB = "/marketplace/stock" as const;

export const MARKETPLACE_ROUTE_STOCK_MANAGER =
  `/marketplace/stock#${STOCK_MANAGER_MODULE_ANCHOR}` as const;

export const MARKETPLACE_ROUTE_CRM_PIPELINE =
  `/marketplace/clients#${CRM_PIPELINE_MODULE_ANCHOR}` as const;

export const MARKETPLACE_ROUTE_RECOVERY_ASSISTED =
  `/marketplace/clients#${RECOVERY_ASSISTED_MODULE_ANCHOR}` as const;

export const MARKETPLACE_ROUTE_CLIENT_FOLLOWUP =
  `/marketplace/clients#${CLIENT_FOLLOWUP_MODULE_ANCHOR}` as const;

export const MARKETPLACE_ROUTE_LOCAL_TABLET_API =
  `/marketplace/integrations#${LOCAL_TABLET_API_MODULE_ANCHOR}` as const;
