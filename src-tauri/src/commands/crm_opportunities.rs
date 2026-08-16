use crate::db::AppDb;
use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use super::projects::ensure_project_belongs_to_workspace;
use super::types::{CrmOpportunityInput, CrmOpportunityRow};

const STAGES: &[&str] = &["lead", "qualified", "proposal", "won", "lost"];

fn normalize_stage(raw: &str) -> Result<&'static str, String> {
    let t = raw.trim();
    STAGES
        .iter()
        .find(|s| **s == t)
        .copied()
        .ok_or_else(|| format!("Étape CRM invalide : {t}"))
}

fn row_from_sql(row: &rusqlite::Row<'_>) -> rusqlite::Result<CrmOpportunityRow> {
    Ok(CrmOpportunityRow {
        id: row.get(0)?,
        workspace_id: row.get(1)?,
        client_id: row.get(2)?,
        quote_id: row.get(3)?,
        project_id: row.get(4)?,
        title: row.get(5)?,
        stage: row.get(6)?,
        amount_estimate: row.get(7)?,
        next_action: row.get(8)?,
        notes: row.get(9)?,
        sort_order: row.get(10)?,
        created_at: row.get(11)?,
        updated_at: row.get(12)?,
    })
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

fn ensure_quote_workspace(
    conn: &Connection,
    workspace_id: &str,
    quote_id: Option<&str>,
) -> Result<(), String> {
    let Some(qid) = quote_id.filter(|s| !s.is_empty()) else {
        return Ok(());
    };
    let n: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM quotes WHERE id = ?1 AND workspace_id = ?2",
            params![qid, workspace_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Devis introuvable dans cet espace.".into());
    }
    Ok(())
}

fn get_workspace_for_opportunity(conn: &Connection, id: &str) -> Result<String, String> {
    conn.query_row(
        "SELECT workspace_id FROM crm_opportunities WHERE id = ?1",
        [id],
        |r| r.get(0),
    )
    .optional()
    .map_err(|e| e.to_string())?
    .ok_or_else(|| "Opportunité introuvable.".to_string())
}

fn next_sort_order(conn: &Connection, workspace_id: &str, stage: &str) -> Result<i64, String> {
    let max: Option<i64> = conn
        .query_row(
            "SELECT MAX(sort_order) FROM crm_opportunities WHERE workspace_id = ?1 AND stage = ?2",
            params![workspace_id, stage],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
        .flatten();
    Ok(max.unwrap_or(0) + 1)
}

#[tauri::command]
pub fn list_crm_opportunities(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<CrmOpportunityRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, client_id, quote_id, project_id, title, stage, amount_estimate, next_action, notes, sort_order, created_at, updated_at \
             FROM crm_opportunities WHERE workspace_id = ?1 \
             ORDER BY stage, sort_order, updated_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], row_from_sql)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_crm_opportunity(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: CrmOpportunityInput,
) -> Result<CrmOpportunityRow, String> {
    let stage = normalize_stage(&input.stage)?;
    let title = input
        .title
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "L’intitulé de l’opportunité est obligatoire.".to_string())?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    ensure_client_workspace(&conn, &workspace_id, input.client_id.as_deref())?;
    ensure_quote_workspace(&conn, &workspace_id, input.quote_id.as_deref())?;
    ensure_project_belongs_to_workspace(&conn, &workspace_id, input.project_id.as_deref())?;

    let sort_order = if let Some(so) = input.sort_order {
        so
    } else {
        next_sort_order(&conn, &workspace_id, stage)?
    };

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO crm_opportunities (id, workspace_id, client_id, quote_id, project_id, title, stage, amount_estimate, next_action, notes, sort_order, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)",
        params![
            id,
            workspace_id,
            input.client_id,
            input.quote_id,
            input.project_id,
            title,
            stage,
            input.amount_estimate,
            input.next_action,
            input.notes,
            sort_order,
            now,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, workspace_id, client_id, quote_id, project_id, title, stage, amount_estimate, next_action, notes, sort_order, created_at, updated_at FROM crm_opportunities WHERE id = ?1",
        [&id],
        row_from_sql,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_crm_opportunity(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: CrmOpportunityInput,
) -> Result<CrmOpportunityRow, String> {
    let stage = normalize_stage(&input.stage)?;
    let title = input
        .title
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "L’intitulé de l’opportunité est obligatoire.".to_string())?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let ws = get_workspace_for_opportunity(&conn, &id)?;
    ensure_client_workspace(&conn, &ws, input.client_id.as_deref())?;
    ensure_quote_workspace(&conn, &ws, input.quote_id.as_deref())?;
    ensure_project_belongs_to_workspace(&conn, &ws, input.project_id.as_deref())?;

    let old: CrmOpportunityRow = conn
        .query_row(
            "SELECT id, workspace_id, client_id, quote_id, project_id, title, stage, amount_estimate, next_action, notes, sort_order, created_at, updated_at FROM crm_opportunities WHERE id = ?1",
            [&id],
            row_from_sql,
        )
        .map_err(|e| e.to_string())?;

    let sort_order = match input.sort_order {
        Some(so) => so,
        None if old.stage != stage => next_sort_order(&conn, &ws, stage)?,
        None => old.sort_order,
    };

    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE crm_opportunities SET client_id=?1, quote_id=?2, project_id=?3, title=?4, stage=?5, amount_estimate=?6, next_action=?7, notes=?8, sort_order=?9, updated_at=?10 WHERE id=?11",
        params![
            input.client_id,
            input.quote_id,
            input.project_id,
            title,
            stage,
            input.amount_estimate,
            input.next_action,
            input.notes,
            sort_order,
            now,
            id,
        ],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, workspace_id, client_id, quote_id, project_id, title, stage, amount_estimate, next_action, notes, sort_order, created_at, updated_at FROM crm_opportunities WHERE id = ?1",
        [&id],
        row_from_sql,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_crm_opportunity(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM crm_opportunities WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
