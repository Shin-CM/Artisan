/**
 * Règles alignées sur la validation IPC (`validate_invoice_line_for_project_time` dans projects.rs).
 * Factures éligibles : classiques, non archivées, même projet, statut hors « payée ».
 * Lignes éligibles : facturation à l’heure uniquement.
 */
export const PROJECT_TIME_INVOICE_LINK_STATUSES_BLOCKED = ["paid"] as const;

export const PROJECT_TIME_LINE_BILLING_MODE = "hourly" as const;
