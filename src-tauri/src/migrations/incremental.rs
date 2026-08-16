use rusqlite::params;
use rusqlite::Connection;
use uuid::Uuid;

use super::helpers::column_exists;

fn migrate_local_api_tables(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS local_api_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            api_enabled INTEGER NOT NULL DEFAULT 0,
            api_port INTEGER NOT NULL DEFAULT 3847,
            updated_at TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS local_api_sessions (
            id TEXT PRIMARY KEY,
            jti TEXT NOT NULL UNIQUE,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            label TEXT,
            created_at TEXT NOT NULL,
            revoked_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_local_api_sessions_ws ON local_api_sessions(workspace_id);
        CREATE TABLE IF NOT EXISTS local_api_operator (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            password_hash TEXT,
            updated_at TEXT NOT NULL DEFAULT ''
        );
    "#,
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO local_api_settings (id, api_enabled, api_port, updated_at) VALUES (1, 0, 3847, '')",
        [],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO local_api_operator (id, password_hash, updated_at) VALUES (1, NULL, '')",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Si l’API locale était déjà activée avant passage en module Marketplace,
/// enregistre le plugin comme actif pour chaque espace afin de ne pas couper l’accès aux réglages.
fn migrate_local_tablet_api_plugin_backfill(conn: &Connection) -> Result<(), String> {
    let api_on: i64 = match conn.query_row(
        "SELECT api_enabled FROM local_api_settings WHERE id = 1",
        [],
        |r| r.get(0),
    ) {
        Ok(v) => v,
        Err(rusqlite::Error::QueryReturnedNoRows) => return Ok(()),
        Err(e) => return Err(e.to_string()),
    };
    if api_on == 0 {
        return Ok(());
    }
    const MANIFEST: &str = r#"{"id":"invoicies.local-tablet-api","name":"API tablette (réseau local)","version":"0.1.0","capabilities":["local_tablet_api"]}"#;
    let mut stmt = conn
        .prepare("SELECT id FROM workspaces")
        .map_err(|e| e.to_string())?;
    let ws_ids: Vec<String> = stmt
        .query_map([], |r| r.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    for ws_id in ws_ids {
        let cnt: i64 = conn
            .query_row(
                "SELECT COUNT(1) FROM plugin_registry WHERE workspace_id = ?1 AND instr(manifest_json, ?2) > 0",
                params![&ws_id, "invoicies.local-tablet-api"],
                |r| r.get(0),
            )
            .unwrap_or(0);
        if cnt > 0 {
            continue;
        }
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO plugin_registry (id, workspace_id, manifest_json, enabled) VALUES (?1, ?2, ?3, 1)",
            params![id, &ws_id, MANIFEST],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Fusion Stock simplifié + Seuils & alertes → Stock Manager (`invoicies.stock-manager`).
fn migrate_stock_manager_plugin_backfill(conn: &Connection) -> Result<(), String> {
    const MANIFEST: &str = r#"{"id":"invoicies.stock-manager","name":"Stock Manager","version":"2.0.0","capabilities":["stock_manager"]}"#;
    const LEGACY_SIMPLE: &str = "invoicies.stock-simple";
    const LEGACY_ALERTS: &str = "invoicies.stock-alerts";
    const NEW_ID: &str = "invoicies.stock-manager";

    let mut stmt = conn
        .prepare("SELECT id FROM workspaces")
        .map_err(|e| e.to_string())?;
    let ws_ids: Vec<String> = stmt
        .query_map([], |r| r.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    for ws_id in ws_ids {
        let legacy_on: bool = conn
            .query_row(
                "SELECT COUNT(1) FROM plugin_registry \
                 WHERE workspace_id = ?1 AND enabled = 1 \
                 AND (instr(manifest_json, ?2) > 0 OR instr(manifest_json, ?3) > 0)",
                params![&ws_id, LEGACY_SIMPLE, LEGACY_ALERTS],
                |r| r.get::<_, i64>(0),
            )
            .map(|c| c > 0)
            .unwrap_or(false);

        let manager_cnt: i64 = conn
            .query_row(
                "SELECT COUNT(1) FROM plugin_registry WHERE workspace_id = ?1 AND instr(manifest_json, ?2) > 0",
                params![&ws_id, NEW_ID],
                |r| r.get(0),
            )
            .unwrap_or(0);

        if manager_cnt > 0 {
            if legacy_on {
                conn.execute(
                    "UPDATE plugin_registry SET enabled = 1 \
                     WHERE workspace_id = ?1 AND instr(manifest_json, ?2) > 0",
                    params![&ws_id, NEW_ID],
                )
                .map_err(|e| e.to_string())?;
            }
            continue;
        }

        if !legacy_on {
            continue;
        }

        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO plugin_registry (id, workspace_id, manifest_json, enabled) VALUES (?1, ?2, ?3, 1)",
            params![id, &ws_id, MANIFEST],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_stock_article_settings(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS stock_article_settings (
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            track_stock INTEGER NOT NULL DEFAULT 0,
            min_quantity REAL,
            reorder_quantity REAL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (workspace_id, article_id)
        );
        CREATE INDEX IF NOT EXISTS idx_stock_article_settings_ws
            ON stock_article_settings(workspace_id);
    "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn migrate_stock_tables(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS stock_levels (
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            quantity REAL NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (workspace_id, article_id)
        );
        CREATE INDEX IF NOT EXISTS idx_stock_levels_ws ON stock_levels(workspace_id);
        CREATE TABLE IF NOT EXISTS stock_movements (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            movement_kind TEXT NOT NULL,
            quantity_delta REAL NOT NULL,
            label TEXT,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_stock_movements_ws ON stock_movements(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_stock_movements_article ON stock_movements(article_id);
    "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn migrate_article_supplier_fields(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "articles", "supplier_name")? {
        conn.execute("ALTER TABLE articles ADD COLUMN supplier_name TEXT", [])
            .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "articles", "supplier_reference")? {
        conn.execute(
            "ALTER TABLE articles ADD COLUMN supplier_reference TEXT",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_invoice_document_kind(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "invoices", "document_kind")? {
        conn.execute(
            "ALTER TABLE invoices ADD COLUMN document_kind TEXT NOT NULL DEFAULT 'invoice'",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "invoices", "credited_invoice_id")? {
        conn.execute(
            "ALTER TABLE invoices ADD COLUMN credited_invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_purchase_orders(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS purchase_orders (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
            number TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT '',
            use_custom_number INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'draft',
            currency TEXT NOT NULL,
            tax_exempt INTEGER NOT NULL DEFAULT 0,
            issue_date TEXT NOT NULL,
            valid_until TEXT,
            subtotal REAL NOT NULL DEFAULT 0,
            tax_total REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            discount_kind TEXT NOT NULL DEFAULT 'none',
            discount_value REAL NOT NULL DEFAULT 0,
            discount_label TEXT,
            notes TEXT,
            pdf_template_variant TEXT,
            archived INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS purchase_order_lines (
            id TEXT PRIMARY KEY,
            purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
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
            show_note_on_purchase_order INTEGER NOT NULL DEFAULT 0,
            billing_mode TEXT NOT NULL DEFAULT 'unit',
            line_discount_kind TEXT NOT NULL DEFAULT 'none',
            line_discount_value REAL NOT NULL DEFAULT 0,
            line_discount_label TEXT
        );

        CREATE TABLE IF NOT EXISTS purchase_order_complements (
            id TEXT PRIMARY KEY,
            purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            snippet_id TEXT REFERENCES text_snippets(id) ON DELETE SET NULL,
            body TEXT NOT NULL DEFAULT ''
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_orders_workspace_number ON purchase_orders(workspace_id, number);
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_ws ON purchase_orders(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_purchase_order_lines_po ON purchase_order_lines(purchase_order_id);
        CREATE INDEX IF NOT EXISTS idx_purchase_order_complements_po ON purchase_order_complements(purchase_order_id);
    "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn migrate_crm_opportunities(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS crm_opportunities (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
            quote_id TEXT REFERENCES quotes(id) ON DELETE SET NULL,
            title TEXT NOT NULL DEFAULT '',
            stage TEXT NOT NULL DEFAULT 'lead',
            amount_estimate REAL,
            next_action TEXT,
            notes TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_crm_opportunities_ws ON crm_opportunities(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON crm_opportunities(workspace_id, stage);
    "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn migrate_projects(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
            code TEXT,
            name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            start_date TEXT,
            end_date TEXT,
            budget_estimate REAL,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_projects_ws ON projects(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_projects_ws_status ON projects(workspace_id, status);
    "#,
    )
    .map_err(|e| e.to_string())?;

    if !column_exists(conn, "quotes", "project_id")? {
        conn.execute(
            "ALTER TABLE quotes ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "invoices", "project_id")? {
        conn.execute(
            "ALTER TABLE invoices ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "purchase_orders", "project_id")? {
        conn.execute(
            "ALTER TABLE purchase_orders ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "crm_opportunities", "project_id")? {
        conn.execute(
            "ALTER TABLE crm_opportunities ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_projects_code_unique_index(conn: &Connection) -> Result<(), String> {
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_workspace_code_unique ON projects(workspace_id, code) WHERE code IS NOT NULL",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn migrate_project_time_entries(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS project_time_entries (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            work_date TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            description TEXT,
            billable INTEGER NOT NULL DEFAULT 1,
            invoice_line_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_project_time_entries_project ON project_time_entries(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_time_entries_ws ON project_time_entries(workspace_id);
    "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn migrate_invoices_use_custom_number(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "invoices", "use_custom_number")? {
        conn.execute(
            "ALTER TABLE invoices ADD COLUMN use_custom_number INTEGER NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_document_discounts(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "quotes", "discount_kind")? {
        conn.execute(
            "ALTER TABLE quotes ADD COLUMN discount_kind TEXT NOT NULL DEFAULT 'none'",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "quotes", "discount_value")? {
        conn.execute(
            "ALTER TABLE quotes ADD COLUMN discount_value REAL NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "quotes", "discount_label")? {
        conn.execute("ALTER TABLE quotes ADD COLUMN discount_label TEXT", [])
            .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "invoices", "discount_kind")? {
        conn.execute(
            "ALTER TABLE invoices ADD COLUMN discount_kind TEXT NOT NULL DEFAULT 'none'",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "invoices", "discount_value")? {
        conn.execute(
            "ALTER TABLE invoices ADD COLUMN discount_value REAL NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "invoices", "discount_label")? {
        conn.execute("ALTER TABLE invoices ADD COLUMN discount_label TEXT", [])
            .map_err(|e| e.to_string())?;
    }
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS discount_presets (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            kind TEXT NOT NULL,
            value REAL NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_discount_presets_ws ON discount_presets(workspace_id);
    "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn migrate_line_discounts(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "quote_lines", "line_discount_kind")? {
        conn.execute(
            "ALTER TABLE quote_lines ADD COLUMN line_discount_kind TEXT NOT NULL DEFAULT 'none'",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "quote_lines", "line_discount_value")? {
        conn.execute(
            "ALTER TABLE quote_lines ADD COLUMN line_discount_value REAL NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "quote_lines", "line_discount_label")? {
        conn.execute(
            "ALTER TABLE quote_lines ADD COLUMN line_discount_label TEXT",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "invoice_lines", "line_discount_kind")? {
        conn.execute(
            "ALTER TABLE invoice_lines ADD COLUMN line_discount_kind TEXT NOT NULL DEFAULT 'none'",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "invoice_lines", "line_discount_value")? {
        conn.execute(
            "ALTER TABLE invoice_lines ADD COLUMN line_discount_value REAL NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "invoice_lines", "line_discount_label")? {
        conn.execute(
            "ALTER TABLE invoice_lines ADD COLUMN line_discount_label TEXT",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_manual_revenue_entries(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS manual_revenue_entries (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'EUR',
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(workspace_id, year, month)
        );
        CREATE INDEX IF NOT EXISTS idx_manual_revenue_ws ON manual_revenue_entries(workspace_id);
        "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn migrate_documents_archived(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "invoices", "archived")? {
        conn.execute(
            "ALTER TABLE invoices ADD COLUMN archived INTEGER NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "quotes", "archived")? {
        conn.execute(
            "ALTER TABLE quotes ADD COLUMN archived INTEGER NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_quotes_columns(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "quotes", "title")? {
        conn.execute(
            "ALTER TABLE quotes ADD COLUMN title TEXT NOT NULL DEFAULT ''",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "quotes", "use_custom_number")? {
        conn.execute(
            "ALTER TABLE quotes ADD COLUMN use_custom_number INTEGER NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_workspace_number ON quotes(workspace_id, number)",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn migrate_quote_line_note(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "quote_lines", "line_note")? {
        conn.execute("ALTER TABLE quote_lines ADD COLUMN line_note TEXT", [])
            .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "quote_lines", "show_note_on_quote")? {
        conn.execute(
            "ALTER TABLE quote_lines ADD COLUMN show_note_on_quote INTEGER NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_clients_details(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "clients", "details_json")? {
        conn.execute("ALTER TABLE clients ADD COLUMN details_json TEXT", [])
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_text_snippets_and_complements(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS text_snippets (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            body TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_text_snippets_ws ON text_snippets(workspace_id);

        CREATE TABLE IF NOT EXISTS quote_complements (
            id TEXT PRIMARY KEY,
            quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            snippet_id TEXT REFERENCES text_snippets(id) ON DELETE SET NULL,
            body TEXT NOT NULL DEFAULT ''
        );
        CREATE INDEX IF NOT EXISTS idx_quote_complements_quote ON quote_complements(quote_id);

        CREATE TABLE IF NOT EXISTS invoice_complements (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            snippet_id TEXT REFERENCES text_snippets(id) ON DELETE SET NULL,
            body TEXT NOT NULL DEFAULT ''
        );
        CREATE INDEX IF NOT EXISTS idx_invoice_complements_inv ON invoice_complements(invoice_id);
        "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn migrate_pdf_template_variant(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "quotes", "pdf_template_variant")? {
        conn.execute(
            "ALTER TABLE quotes ADD COLUMN pdf_template_variant TEXT",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "invoices", "pdf_template_variant")? {
        conn.execute(
            "ALTER TABLE invoices ADD COLUMN pdf_template_variant TEXT",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_article_tariffs_and_line_billing(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "articles", "flat_price")? {
        conn.execute("ALTER TABLE articles ADD COLUMN flat_price REAL", [])
            .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "articles", "hourly_rate")? {
        conn.execute("ALTER TABLE articles ADD COLUMN hourly_rate REAL", [])
            .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "quote_lines", "billing_mode")? {
        conn.execute(
            "ALTER TABLE quote_lines ADD COLUMN billing_mode TEXT NOT NULL DEFAULT 'unit'",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "invoice_lines", "billing_mode")? {
        conn.execute(
            "ALTER TABLE invoice_lines ADD COLUMN billing_mode TEXT NOT NULL DEFAULT 'unit'",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_articles_clients_sort_order(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "articles", "sort_order")? {
        conn.execute(
            "ALTER TABLE articles ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "clients", "sort_order")? {
        conn.execute(
            "ALTER TABLE clients ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn migrate_invoice_line_notes(conn: &Connection) -> Result<(), String> {
    if !column_exists(conn, "invoice_lines", "line_note")? {
        conn.execute("ALTER TABLE invoice_lines ADD COLUMN line_note TEXT", [])
            .map_err(|e| e.to_string())?;
    }
    if !column_exists(conn, "invoice_lines", "show_note_on_invoice")? {
        conn.execute(
            "ALTER TABLE invoice_lines ADD COLUMN show_note_on_invoice INTEGER NOT NULL DEFAULT 0",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub(super) fn run(conn: &Connection) -> Result<(), String> {
    migrate_quotes_columns(conn)?;
    migrate_quote_line_note(conn)?;
    migrate_clients_details(conn)?;
    migrate_invoice_line_notes(conn)?;
    migrate_text_snippets_and_complements(conn)?;
    migrate_pdf_template_variant(conn)?;
    migrate_articles_clients_sort_order(conn)?;
    migrate_article_tariffs_and_line_billing(conn)?;
    migrate_documents_archived(conn)?;
    migrate_manual_revenue_entries(conn)?;
    migrate_document_discounts(conn)?;
    migrate_line_discounts(conn)?;
    migrate_invoices_use_custom_number(conn)?;
    migrate_invoice_document_kind(conn)?;
    migrate_purchase_orders(conn)?;
    migrate_crm_opportunities(conn)?;
    migrate_projects(conn)?;
    migrate_projects_code_unique_index(conn)?;
    migrate_project_time_entries(conn)?;
    migrate_stock_tables(conn)?;
    migrate_stock_article_settings(conn)?;
    migrate_stock_manager_plugin_backfill(conn)?;
    migrate_article_supplier_fields(conn)?;
    migrate_local_api_tables(conn)?;
    migrate_local_tablet_api_plugin_backfill(conn)?;
    Ok(())
}
