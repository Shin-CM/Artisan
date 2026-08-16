use rusqlite::Connection;

pub fn migrate(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS client_contact_events (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            kind TEXT NOT NULL DEFAULT 'note',
            body TEXT,
            occurred_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_client_contact_events_ws_client ON client_contact_events(workspace_id, client_id);
        CREATE INDEX IF NOT EXISTS idx_client_contact_events_occurred ON client_contact_events(workspace_id, client_id, occurred_at);

        CREATE TABLE IF NOT EXISTS client_reminders (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
            title TEXT NOT NULL DEFAULT '',
            note TEXT,
            due_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            recurrence_rule TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_client_reminders_ws ON client_reminders(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_client_reminders_due ON client_reminders(workspace_id, due_at);
        CREATE INDEX IF NOT EXISTS idx_client_reminders_client ON client_reminders(workspace_id, client_id);

        CREATE TABLE IF NOT EXISTS client_tags (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            color TEXT,
            created_at TEXT NOT NULL,
            UNIQUE(workspace_id, name)
        );
        CREATE INDEX IF NOT EXISTS idx_client_tags_ws ON client_tags(workspace_id);

        CREATE TABLE IF NOT EXISTS client_tag_links (
            client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            tag_id TEXT NOT NULL REFERENCES client_tags(id) ON DELETE CASCADE,
            PRIMARY KEY (client_id, tag_id)
        );
        CREATE INDEX IF NOT EXISTS idx_client_tag_links_tag ON client_tag_links(tag_id);
    "#,
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_quotes_ws_client ON quotes(workspace_id, client_id)",
        [],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_invoices_ws_client ON invoices(workspace_id, client_id)",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
