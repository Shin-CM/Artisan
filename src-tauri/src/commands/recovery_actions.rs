use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use crate::db::AppDb;

use super::types::{RecoveryActionInput, RecoveryActionRow};

fn validate_due(value: &str) -> Result<(), String> {
    if value.len() < 10 {
        return Err("due_at invalide (format YYYY-MM-DD ou ISO).".into());
    }
    let bytes = value.as_bytes();
    let ok = bytes[0].is_ascii_digit()
        && bytes[1].is_ascii_digit()
        && bytes[2].is_ascii_digit()
        && bytes[3].is_ascii_digit()
        && bytes[4] == b'-'
        && bytes[5].is_ascii_digit()
        && bytes[6].is_ascii_digit()
        && bytes[7] == b'-'
        && bytes[8].is_ascii_digit()
        && bytes[9].is_ascii_digit();
    if !ok {
        return Err("due_at invalide (format YYYY-MM-DD ou ISO).".into());
    }
    Ok(())
}

fn normalize_kind(kind: Option<&str>) -> String {
    kind.map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "email".to_string())
}

fn normalize_status(status: Option<&str>) -> String {
    status
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "scheduled".to_string())
}

#[tauri::command]
pub fn list_recovery_actions(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<RecoveryActionRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, invoice_id, kind, status, due_at, notes, created_at, updated_at \
             FROM recovery_actions WHERE workspace_id = ?1 ORDER BY due_at ASC, created_at ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |row| {
            Ok(RecoveryActionRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                invoice_id: row.get(2)?,
                kind: row.get(3)?,
                status: row.get(4)?,
                due_at: row.get(5)?,
                notes: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_recovery_action(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: RecoveryActionInput,
) -> Result<RecoveryActionRow, String> {
    validate_due(&input.due_at)?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let kind = normalize_kind(input.kind.as_deref());
    let status = normalize_status(input.status.as_deref());
    let notes = input
        .notes
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    conn.execute(
        "INSERT INTO recovery_actions (id, workspace_id, invoice_id, kind, status, due_at, notes, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
        params![
            id,
            workspace_id,
            input.invoice_id,
            kind,
            status,
            input.due_at,
            notes,
            now,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    get_recovery_action(db, id)
}

#[tauri::command]
pub fn get_recovery_action(
    db: tauri::State<'_, AppDb>,
    id: String,
) -> Result<RecoveryActionRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, workspace_id, invoice_id, kind, status, due_at, notes, created_at, updated_at \
         FROM recovery_actions WHERE id = ?1",
        [&id],
        |row| {
            Ok(RecoveryActionRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                invoice_id: row.get(2)?,
                kind: row.get(3)?,
                status: row.get(4)?,
                due_at: row.get(5)?,
                notes: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        },
    )
    .map_err(|_| "Relance introuvable.".to_string())
}

#[tauri::command]
pub fn update_recovery_action(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: RecoveryActionInput,
) -> Result<RecoveryActionRow, String> {
    validate_due(&input.due_at)?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let kind = normalize_kind(input.kind.as_deref());
    let status = normalize_status(input.status.as_deref());
    let notes = input
        .notes
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let affected = conn
        .execute(
            "UPDATE recovery_actions SET invoice_id = ?1, kind = ?2, status = ?3, due_at = ?4, notes = ?5, updated_at = ?6 WHERE id = ?7",
            params![
                input.invoice_id,
                kind,
                status,
                input.due_at,
                notes,
                now,
                id,
            ],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err("Relance introuvable.".into());
    }
    drop(conn);
    get_recovery_action(db, id)
}

#[tauri::command]
pub fn delete_recovery_action(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM recovery_actions WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
