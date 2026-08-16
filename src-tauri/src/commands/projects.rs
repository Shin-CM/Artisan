use crate::db::AppDb;
use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use super::types::{
    ProjectDocumentRow, ProjectFinancialSummary, ProjectImportRecord, ProjectInput,
    ProjectLinkCounts, ProjectRow, ProjectTimeEntryInput, ProjectTimeEntryRow,
    ProjectTimeInvoiceLineOption, ProjectTimeInvoiceSummary,
};

const STATUSES: &[&str] = &["draft", "active", "on_hold", "completed", "cancelled"];

fn normalize_status(raw: &str) -> Result<&'static str, String> {
    let t = raw.trim();
    STATUSES
        .iter()
        .find(|s| **s == t)
        .copied()
        .ok_or_else(|| format!("Statut de projet invalide : {t}"))
}

fn map_sqlite_project_err(e: rusqlite::Error) -> String {
    match &e {
        rusqlite::Error::SqliteFailure(ie, _) => {
            if ie.code == rusqlite::ErrorCode::ConstraintViolation {
                return "Ce code projet est déjà utilisé dans cet espace.".into();
            }
        }
        _ => {}
    }
    e.to_string()
}

/// Vérifie qu’un `project_id` non vide appartient au workspace (sinon erreur).
pub(crate) fn ensure_project_belongs_to_workspace(
    conn: &Connection,
    workspace_id: &str,
    project_id: Option<&str>,
) -> Result<(), String> {
    let Some(pid) = project_id.filter(|s| !s.trim().is_empty()) else {
        return Ok(());
    };
    let n: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM projects WHERE id = ?1 AND workspace_id = ?2",
            params![pid, workspace_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Projet introuvable dans cet espace.".into());
    }
    Ok(())
}

fn ensure_client_workspace(
    conn: &Connection,
    workspace_id: &str,
    client_id: Option<&str>,
) -> Result<(), String> {
    let Some(cid) = client_id.filter(|s| !s.is_empty()) else {
        return Ok(());
    };
    let n: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM clients WHERE id = ?1 AND workspace_id = ?2",
            params![cid, workspace_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Client introuvable dans cet espace.".into());
    }
    Ok(())
}

fn row_from_sql(row: &rusqlite::Row<'_>) -> rusqlite::Result<ProjectRow> {
    Ok(ProjectRow {
        id: row.get(0)?,
        workspace_id: row.get(1)?,
        client_id: row.get(2)?,
        code: row.get(3)?,
        name: row.get(4)?,
        status: row.get(5)?,
        start_date: row.get(6)?,
        end_date: row.get(7)?,
        budget_estimate: row.get(8)?,
        notes: row.get(9)?,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
    })
}

fn get_workspace_for_project(conn: &Connection, id: &str) -> Result<String, String> {
    conn.query_row(
        "SELECT workspace_id FROM projects WHERE id = ?1",
        [id],
        |r| r.get(0),
    )
    .optional()
    .map_err(|e| e.to_string())?
    .ok_or_else(|| "Projet introuvable.".to_string())
}

fn time_entry_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<ProjectTimeEntryRow> {
    let inv_num: Option<String> = row.get(10)?;
    let line_lbl: Option<String> = row.get(11)?;
    Ok(ProjectTimeEntryRow {
        id: row.get(0)?,
        workspace_id: row.get(1)?,
        project_id: row.get(2)?,
        work_date: row.get(3)?,
        duration_minutes: row.get(4)?,
        description: row.get(5)?,
        billable: row.get::<_, i64>(6)? == 1,
        invoice_line_id: row.get(7)?,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
        invoice_number: inv_num.filter(|s| !s.is_empty()),
        invoice_line_label: line_lbl.filter(|s| !s.is_empty()),
    })
}

/// Valide une ligne de facture pour l’imputation de temps sur un projet (facture classique, même projet, etc.).
fn validate_invoice_line_for_project_time(
    conn: &Connection,
    workspace_id: &str,
    project_id: &str,
    line_id: Option<&str>,
) -> Result<(), String> {
    let Some(lid) = line_id.map(str::trim).filter(|s| !s.is_empty()) else {
        return Ok(());
    };
    let (inv_id, billing): (String, String) = conn
        .query_row(
            "SELECT invoice_id, billing_mode FROM invoice_lines WHERE id = ?1",
            [lid],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .map_err(|_| "Ligne de facture introuvable.".to_string())?;
    let (ws, proj, arch, dk, status): (String, Option<String>, i64, String, String) = conn
        .query_row(
            "SELECT workspace_id, project_id, archived, COALESCE(document_kind, 'invoice'), status FROM invoices WHERE id = ?1",
            [&inv_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
        )
        .map_err(|_| "Facture introuvable.".to_string())?;
    if ws != workspace_id {
        return Err("La facture n’appartient pas à cet espace.".into());
    }
    if dk != "invoice" {
        return Err(
            "Seules les factures classiques permettent d’imputer du temps sur une ligne.".into(),
        );
    }
    if arch != 0 {
        return Err("Facture archivée : imputation de temps impossible.".into());
    }
    match proj.as_deref() {
        Some(p) if p == project_id => {}
        _ => {
            return Err(
                "La facture doit être liée au même projet que cette entrée de temps.".into(),
            );
        }
    }
    if status.trim() == "paid" {
        return Err("Impossible de lier du temps à une facture au statut « Payée ».".into());
    }
    if billing.trim() != "hourly" {
        return Err(
            "Seules les lignes en facturation « à l’heure » peuvent être liées au temps passé."
                .into(),
        );
    }
    Ok(())
}

#[tauri::command]
pub fn list_projects(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<ProjectRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, client_id, code, name, status, start_date, end_date, budget_estimate, notes, created_at, updated_at \
             FROM projects WHERE workspace_id = ?1 ORDER BY updated_at DESC, name ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], row_from_sql)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_project(db: tauri::State<'_, AppDb>, id: String) -> Result<ProjectRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, workspace_id, client_id, code, name, status, start_date, end_date, budget_estimate, notes, created_at, updated_at FROM projects WHERE id = ?1",
        [&id],
        row_from_sql,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_project(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: ProjectInput,
) -> Result<ProjectRow, String> {
    let status = normalize_status(&input.status)?;
    let name = input.name.trim().to_string();
    if name.is_empty() {
        return Err("Le nom du projet est obligatoire.".into());
    }
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    ensure_client_workspace(&conn, &workspace_id, input.client_id.as_deref())?;

    let code = input
        .code
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO projects (id, workspace_id, client_id, code, name, status, start_date, end_date, budget_estimate, notes, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)",
        params![
            id,
            workspace_id,
            input.client_id,
            code,
            name,
            status,
            input.start_date,
            input.end_date,
            input.budget_estimate,
            input.notes,
            now,
            now,
        ],
    )
    .map_err(map_sqlite_project_err)?;

    conn.query_row(
        "SELECT id, workspace_id, client_id, code, name, status, start_date, end_date, budget_estimate, notes, created_at, updated_at FROM projects WHERE id = ?1",
        [&id],
        row_from_sql,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_project(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: ProjectInput,
) -> Result<ProjectRow, String> {
    let status = normalize_status(&input.status)?;
    let name = input.name.trim().to_string();
    if name.is_empty() {
        return Err("Le nom du projet est obligatoire.".into());
    }
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let ws = get_workspace_for_project(&conn, &id)?;
    ensure_client_workspace(&conn, &ws, input.client_id.as_deref())?;

    let code = input
        .code
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE projects SET client_id=?1, code=?2, name=?3, status=?4, start_date=?5, end_date=?6, budget_estimate=?7, notes=?8, updated_at=?9 WHERE id=?10",
        params![
            input.client_id,
            code,
            name,
            status,
            input.start_date,
            input.end_date,
            input.budget_estimate,
            input.notes,
            now,
            id,
        ],
    )
    .map_err(map_sqlite_project_err)?;

    conn.query_row(
        "SELECT id, workspace_id, client_id, code, name, status, start_date, end_date, budget_estimate, notes, created_at, updated_at FROM projects WHERE id = ?1",
        [&id],
        row_from_sql,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_project(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM projects WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn count_project_links(
    db: tauri::State<'_, AppDb>,
    project_id: String,
) -> Result<ProjectLinkCounts, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let ws: String = conn
        .query_row(
            "SELECT workspace_id FROM projects WHERE id = ?1",
            [&project_id],
            |r| r.get(0),
        )
        .map_err(|_| "Projet introuvable.".to_string())?;

    let quotes: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM quotes WHERE project_id = ?1 AND workspace_id = ?2",
            params![project_id, ws],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    let invoices: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM invoices WHERE project_id = ?1 AND workspace_id = ?2 AND document_kind = 'invoice'",
            params![project_id, ws],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    let credit_notes: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM invoices WHERE project_id = ?1 AND workspace_id = ?2 AND document_kind = 'credit_note'",
            params![project_id, ws],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    let purchase_orders: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM purchase_orders WHERE project_id = ?1 AND workspace_id = ?2",
            params![project_id, ws],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    let crm_opportunities: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM crm_opportunities WHERE project_id = ?1 AND workspace_id = ?2",
            params![project_id, ws],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(ProjectLinkCounts {
        quotes,
        invoices,
        credit_notes,
        purchase_orders,
        crm_opportunities,
    })
}

#[tauri::command]
pub fn get_project_financial_summary(
    db: tauri::State<'_, AppDb>,
    project_id: String,
) -> Result<ProjectFinancialSummary, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let (ws, budget): (String, Option<f64>) = conn
        .query_row(
            "SELECT workspace_id, budget_estimate FROM projects WHERE id = ?1",
            [&project_id],
            |r| Ok((r.get::<_, String>(0)?, r.get(1)?)),
        )
        .map_err(|_| "Projet introuvable.".to_string())?;

    let invoiced_total: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total), 0) FROM invoices WHERE project_id = ?1 AND workspace_id = ?2 AND document_kind = 'invoice' AND archived = 0",
            params![project_id, ws],
            |r| r.get(0),
        )
        .unwrap_or(0.0);
    let credit_notes_total: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total), 0) FROM invoices WHERE project_id = ?1 AND workspace_id = ?2 AND document_kind = 'credit_note' AND archived = 0",
            params![project_id, ws],
            |r| r.get(0),
        )
        .unwrap_or(0.0);
    let quotes_accepted_total: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total), 0) FROM quotes WHERE project_id = ?1 AND workspace_id = ?2 AND status = 'accepted' AND archived = 0",
            params![project_id, ws],
            |r| r.get(0),
        )
        .unwrap_or(0.0);
    let purchase_orders_total: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total), 0) FROM purchase_orders WHERE project_id = ?1 AND workspace_id = ?2 AND archived = 0",
            params![project_id, ws],
            |r| r.get(0),
        )
        .unwrap_or(0.0);

    Ok(ProjectFinancialSummary {
        budget_estimate: budget,
        invoiced_total,
        credit_notes_total,
        quotes_accepted_total,
        purchase_orders_total,
    })
}

#[tauri::command]
pub fn import_projects_bundle(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    records: Vec<ProjectImportRecord>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    for rec in records {
        let id = rec.id.trim().to_string();
        if id.is_empty() {
            continue;
        }
        let status = normalize_status(&rec.status)?;
        let name = rec.name.trim().to_string();
        if name.is_empty() {
            continue;
        }
        ensure_client_workspace(&conn, &workspace_id, rec.client_id.as_deref())?;
        let code = rec
            .code
            .as_ref()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());
        let created = rec.created_at.clone().unwrap_or_else(|| now.clone());
        let updated = rec.updated_at.unwrap_or_else(|| now.clone());
        conn.execute(
            "INSERT OR REPLACE INTO projects (id, workspace_id, client_id, code, name, status, start_date, end_date, budget_estimate, notes, created_at, updated_at) \
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)",
            params![
                id,
                workspace_id,
                rec.client_id,
                code,
                name,
                status,
                rec.start_date,
                rec.end_date,
                rec.budget_estimate,
                rec.notes,
                created,
                updated,
            ],
        )
        .map_err(map_sqlite_project_err)?;
    }
    Ok(())
}

const TIME_ENTRY_SELECT: &str = "SELECT te.id, te.workspace_id, te.project_id, te.work_date, te.duration_minutes, te.description, te.billable, te.invoice_line_id, te.created_at, te.updated_at, \
     i.number, il.description \
     FROM project_time_entries te \
     LEFT JOIN invoice_lines il ON il.id = te.invoice_line_id \
     LEFT JOIN invoices i ON i.id = il.invoice_id ";

#[tauri::command]
pub fn list_invoices_for_project_time(
    db: tauri::State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<ProjectTimeInvoiceSummary>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let _ws = get_workspace_for_project(&conn, &project_id)?;
    let mut stmt = conn
        .prepare(
            "SELECT i.id, i.number, i.issue_date, i.status FROM invoices i \
             WHERE i.project_id = ?1 AND i.workspace_id = (SELECT workspace_id FROM projects WHERE id = ?1) \
             AND COALESCE(i.document_kind, 'invoice') = 'invoice' AND i.archived = 0 AND i.status != 'paid' \
             ORDER BY i.issue_date DESC, i.number DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&project_id], |r| {
            Ok(ProjectTimeInvoiceSummary {
                id: r.get(0)?,
                number: r.get(1)?,
                issue_date: r.get(2)?,
                status: r.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_invoice_lines_for_project_time(
    db: tauri::State<'_, AppDb>,
    project_id: String,
    invoice_id: String,
) -> Result<Vec<ProjectTimeInvoiceLineOption>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let ws = get_workspace_for_project(&conn, &project_id)?;
    let n: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM invoices WHERE id = ?1 AND project_id = ?2 AND workspace_id = ?3 \
             AND COALESCE(document_kind, 'invoice') = 'invoice' AND archived = 0 AND status != 'paid'",
            rusqlite::params![&invoice_id, &project_id, &ws],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Facture introuvable ou non éligible pour ce projet.".into());
    }
    let mut stmt = conn
        .prepare(
            "SELECT id, description FROM invoice_lines WHERE invoice_id = ?1 AND billing_mode = 'hourly' ORDER BY sort_order",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&invoice_id], |r| {
            Ok(ProjectTimeInvoiceLineOption {
                id: r.get(0)?,
                description: r.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_project_time_entries(
    db: tauri::State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<ProjectTimeEntryRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(&format!(
            "{TIME_ENTRY_SELECT} WHERE te.project_id = ?1 ORDER BY te.work_date DESC, te.created_at DESC"
        ))
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&project_id], time_entry_row)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_project_time_entry(
    db: tauri::State<'_, AppDb>,
    project_id: String,
    input: ProjectTimeEntryInput,
) -> Result<ProjectTimeEntryRow, String> {
    if input.duration_minutes <= 0 {
        return Err("La durée doit être positive.".into());
    }
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let ws = get_workspace_for_project(&conn, &project_id)?;
    validate_invoice_line_for_project_time(
        &conn,
        &ws,
        &project_id,
        input.invoice_line_id.as_deref(),
    )?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let billable = if input.billable { 1i64 } else { 0i64 };
    conn.execute(
        "INSERT INTO project_time_entries (id, workspace_id, project_id, work_date, duration_minutes, description, billable, invoice_line_id, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        params![
            id,
            ws,
            project_id,
            input.work_date.trim(),
            input.duration_minutes,
            input.description,
            billable,
            input.invoice_line_id,
            now,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;
    conn.query_row(
        &format!("{TIME_ENTRY_SELECT} WHERE te.id = ?1"),
        [&id],
        time_entry_row,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_project_time_entry(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: ProjectTimeEntryInput,
) -> Result<ProjectTimeEntryRow, String> {
    if input.duration_minutes <= 0 {
        return Err("La durée doit être positive.".into());
    }
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let (pid, ws): (String, String) = conn
        .query_row(
            "SELECT project_id, workspace_id FROM project_time_entries WHERE id = ?1",
            [&id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .map_err(|_| "Entrée introuvable.".to_string())?;
    validate_invoice_line_for_project_time(&conn, &ws, &pid, input.invoice_line_id.as_deref())?;
    let now = Utc::now().to_rfc3339();
    let billable = if input.billable { 1i64 } else { 0i64 };
    let n = conn.execute(
        "UPDATE project_time_entries SET work_date=?1, duration_minutes=?2, description=?3, billable=?4, invoice_line_id=?5, updated_at=?6 WHERE id=?7",
        params![
            input.work_date.trim(),
            input.duration_minutes,
            input.description,
            billable,
            input.invoice_line_id,
            now,
            id,
        ],
    )
    .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Entrée introuvable.".into());
    }
    conn.query_row(
        &format!("{TIME_ENTRY_SELECT} WHERE te.id = ?1"),
        [&id],
        time_entry_row,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_project_time_entry(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let n = conn
        .execute("DELETE FROM project_time_entries WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Entrée introuvable.".into());
    }
    Ok(())
}

#[tauri::command]
pub fn list_project_documents(
    db: tauri::State<'_, AppDb>,
    project_id: String,
) -> Result<Vec<ProjectDocumentRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let ws: String = conn
        .query_row(
            "SELECT workspace_id FROM projects WHERE id = ?1",
            [&project_id],
            |r| r.get(0),
        )
        .map_err(|_| "Projet introuvable.".to_string())?;

    let mut out: Vec<ProjectDocumentRow> = Vec::new();

    let mut stmt = conn
        .prepare(
            "SELECT id, number, status, total, archived, issue_date FROM quotes WHERE project_id = ?1 AND workspace_id = ?2 ORDER BY issue_date DESC",
        )
        .map_err(|e| e.to_string())?;
    let qrows = stmt
        .query_map(params![project_id, ws], |row| {
            Ok(ProjectDocumentRow {
                document_kind: "quote".into(),
                id: row.get(0)?,
                number: row.get(1)?,
                status: row.get(2)?,
                total: row.get(3)?,
                archived: row.get::<_, i64>(4)? == 1,
                issue_date: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;
    for r in qrows {
        out.push(r.map_err(|e| e.to_string())?);
    }

    let mut stmt = conn
        .prepare(
            "SELECT id, number, document_kind, status, total, archived, issue_date FROM invoices WHERE project_id = ?1 AND workspace_id = ?2 ORDER BY issue_date DESC",
        )
        .map_err(|e| e.to_string())?;
    let irows = stmt
        .query_map(params![project_id, ws], |row| {
            Ok(ProjectDocumentRow {
                document_kind: row.get(2)?,
                id: row.get(0)?,
                number: row.get(1)?,
                status: row.get(3)?,
                total: row.get(4)?,
                archived: row.get::<_, i64>(5)? == 1,
                issue_date: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    for r in irows {
        out.push(r.map_err(|e| e.to_string())?);
    }

    let mut stmt = conn
        .prepare(
            "SELECT id, number, status, total, archived, issue_date FROM purchase_orders WHERE project_id = ?1 AND workspace_id = ?2 ORDER BY issue_date DESC",
        )
        .map_err(|e| e.to_string())?;
    let prows = stmt
        .query_map(params![project_id, ws], |row| {
            Ok(ProjectDocumentRow {
                document_kind: "purchase_order".into(),
                id: row.get(0)?,
                number: row.get(1)?,
                status: row.get(2)?,
                total: row.get(3)?,
                archived: row.get::<_, i64>(4)? == 1,
                issue_date: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;
    for r in prows {
        out.push(r.map_err(|e| e.to_string())?);
    }

    Ok(out)
}
