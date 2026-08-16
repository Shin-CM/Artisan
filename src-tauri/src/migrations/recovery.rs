use rusqlite::Connection;

/// Migration de la table `recovery_actions` (relances planifiées sur facture).
pub fn migrate(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS recovery_actions (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
            kind TEXT NOT NULL DEFAULT 'email',
            status TEXT NOT NULL DEFAULT 'scheduled',
            due_at TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_recovery_actions_ws
            ON recovery_actions(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_recovery_actions_due
            ON recovery_actions(workspace_id, due_at);
        CREATE INDEX IF NOT EXISTS idx_recovery_actions_invoice
            ON recovery_actions(invoice_id);
        "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
