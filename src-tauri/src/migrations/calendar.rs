use rusqlite::Connection;

/// Migration de la table `calendar_events` (événements neutres, multi-jours,
/// liens facultatifs vers client / projet / facture).
pub fn migrate(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS calendar_events (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            note TEXT,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            color_key TEXT,
            color_hex TEXT,
            client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
            project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
            invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_calendar_events_ws
            ON calendar_events(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_calendar_events_span
            ON calendar_events(workspace_id, start_date, end_date);
        "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
