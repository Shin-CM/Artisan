use rusqlite::{Connection, OptionalExtension};
use std::path::Path;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct AppDb {
    pub conn: Arc<Mutex<Connection>>,
}

pub fn open_and_migrate(path: &Path) -> Result<Connection, String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.execute_batch(
        r#"
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            entity_type TEXT NOT NULL DEFAULT 'company',
            country_code TEXT NOT NULL DEFAULT 'FR',
            profile_json TEXT NOT NULL DEFAULT '{}',
            base_currency TEXT NOT NULL DEFAULT 'EUR',
            theme TEXT NOT NULL DEFAULT 'system',
            pdf_output_dir TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address_json TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS article_categories (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            parent_id TEXT REFERENCES article_categories(id) ON DELETE SET NULL,
            name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS articles (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            category_id TEXT REFERENCES article_categories(id) ON DELETE SET NULL,
            name TEXT NOT NULL,
            description TEXT,
            base_price REAL NOT NULL DEFAULT 0,
            production_cost REAL,
            options_json TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tax_rates (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            rate REAL NOT NULL,
            is_default INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS quotes (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
            number TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            currency TEXT NOT NULL,
            tax_exempt INTEGER NOT NULL DEFAULT 0,
            issue_date TEXT NOT NULL,
            valid_until TEXT,
            subtotal REAL NOT NULL DEFAULT 0,
            tax_total REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            notes TEXT,
            title TEXT NOT NULL DEFAULT '',
            use_custom_number INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS quote_lines (
            id TEXT PRIMARY KEY,
            quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
            article_id TEXT REFERENCES articles(id) ON DELETE SET NULL,
            description TEXT NOT NULL,
            options_snapshot_json TEXT NOT NULL DEFAULT '{}',
            quantity REAL NOT NULL DEFAULT 1,
            unit_price REAL NOT NULL,
            tax_rate REAL NOT NULL DEFAULT 0,
            line_subtotal REAL NOT NULL DEFAULT 0,
            line_tax REAL NOT NULL DEFAULT 0,
            line_total REAL NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            line_note TEXT,
            show_note_on_quote INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
            quote_id TEXT REFERENCES quotes(id) ON DELETE SET NULL,
            number TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            currency TEXT NOT NULL,
            tax_exempt INTEGER NOT NULL DEFAULT 0,
            issue_date TEXT NOT NULL,
            due_date TEXT,
            subtotal REAL NOT NULL DEFAULT 0,
            tax_total REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            amount_paid REAL NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS invoice_lines (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
            article_id TEXT REFERENCES articles(id) ON DELETE SET NULL,
            description TEXT NOT NULL,
            options_snapshot_json TEXT NOT NULL DEFAULT '{}',
            quantity REAL NOT NULL DEFAULT 1,
            unit_price REAL NOT NULL,
            tax_rate REAL NOT NULL DEFAULT 0,
            line_subtotal REAL NOT NULL DEFAULT 0,
            line_tax REAL NOT NULL DEFAULT 0,
            line_total REAL NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS import_history (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            source_type TEXT NOT NULL,
            module TEXT NOT NULL,
            file_name TEXT,
            record_count INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS plugin_registry (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            manifest_json TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS app_counters (
            workspace_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value INTEGER NOT NULL,
            PRIMARY KEY (workspace_id, key)
        );

        CREATE INDEX IF NOT EXISTS idx_tax_rates_ws ON tax_rates(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_clients_ws ON clients(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_categories_ws ON article_categories(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_articles_ws ON articles(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_quotes_ws ON quotes(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_invoices_ws ON invoices(workspace_id);
    "#,
    )
    .map_err(|e| e.to_string())?;

    crate::migrations::run_incremental_migrations(&conn)?;
    crate::migrations::client_followup::migrate(&conn)?;
    crate::migrations::calendar::migrate(&conn)?;
    crate::migrations::holiday_cache::migrate(&conn)?;
    crate::migrations::recovery::migrate(&conn)?;

    Ok(conn)
}

/// Prochain numéro séquentiel sans incrémenter le compteur (aperçu UI).
pub fn peek_next_document_number(
    conn: &Connection,
    workspace_id: &str,
    prefix: &str,
) -> Result<String, String> {
    let key = format!("doc_counter_{}", prefix);
    let current: Option<i64> = conn
        .query_row(
            "SELECT value FROM app_counters WHERE workspace_id = ?1 AND key = ?2",
            [workspace_id, &key],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    let next = current.unwrap_or(0) + 1;
    Ok(format!("{}-{:05}", prefix, next))
}

pub fn next_document_number(
    conn: &Connection,
    workspace_id: &str,
    prefix: &str,
) -> Result<String, String> {
    let key = format!("doc_counter_{}", prefix);
    let current: Option<i64> = conn
        .query_row(
            "SELECT value FROM app_counters WHERE workspace_id = ?1 AND key = ?2",
            [workspace_id, &key],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    let next = current.unwrap_or(0) + 1;
    conn.execute(
        "INSERT INTO app_counters (workspace_id, key, value) VALUES (?1, ?2, ?3)
         ON CONFLICT(workspace_id, key) DO UPDATE SET value = excluded.value",
        rusqlite::params![workspace_id, key, next],
    )
    .map_err(|e| e.to_string())?;

    Ok(format!("{}-{:05}", prefix, next))
}
