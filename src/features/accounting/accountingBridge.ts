/**
 * Pont vers la future Marketplace « Comptabilité Essentials » (Vague 2).
 * Pas d’IPC ni de tables SQLite ici : contrat métier et manifeste stub pour aligner l’app.
 */

export const ACCOUNTING_ESSENTIALS_PLUGIN_ID = "invoicies.accounting-essentials";

/** Version du cadrage stocké côté app (incrémenter si le contrat évolue). */
export const ACCOUNTING_BRIDGE_PLAN_VERSION = 1 as const;

/** Ligne de journal cible (pré-compta) — schéma logique, pas une table SQLite aujourd’hui. */
export type AccountingJournalLineStub = {
  /** Référence stable côté facturation (facture, avoir, paiement). */
  sourceDocumentId: string;
  sourceKind: "invoice" | "credit_note" | "payment";
  /** Compte général ou auxiliaire — à cadrer par pays / plan comptable. */
  accountCode: string;
  label: string;
  debit: number;
  credit: number;
  /** ISO date d’effet comptable. */
  entryDate: string;
};

/** Manifeste minimal pour enregistrement futur dans `plugin_registry` (module désactivé par défaut). */
export const ACCOUNTING_ESSENTIALS_MANIFEST_STUB_V1 = {
  id: ACCOUNTING_ESSENTIALS_PLUGIN_ID,
  name: "Comptabilité Essentials",
  version: "0.0.0-stub",
  description:
    "Pré-compta, exports et balance — module Marketplace (chantier Vague 2).",
  capabilities: [] as string[],
} as const;
