use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use crate::db::AppDb;

use super::super::types::{ClientReminderInput, ClientReminderRow};
use super::helpers::ensure_client_in_workspace;

#[tauri::command]
pub fn list_reminders(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<ClientReminderRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, client_id, title, note, due_at, status, recurrence_rule, created_at, updated_at \
             FROM client_reminders WHERE workspace_id = ?1 ORDER BY due_at ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |row| {
            Ok(ClientReminderRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                client_id: row.get(2)?,
                title: row.get(3)?,
                note: row.get(4)?,
                due_at: row.get(5)?,
                status: row.get(6)?,
                recurrence_rule: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_reminder(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: ClientReminderInput,
) -> Result<ClientReminderRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    if let Some(ref cid) = input.client_id {
        ensure_client_in_workspace(&conn, &workspace_id, cid)?;
    }
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let status = input
        .status
        .unwrap_or_else(|| "pending".into())
        .trim()
        .to_string();
    let title = input.title.trim().to_string();
    if title.is_empty() {
        return Err("Titre obligatoire.".into());
    }
    conn.execute(
        "INSERT INTO client_reminders (id, workspace_id, client_id, title, note, due_at, status, recurrence_rule, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        params![
            id,
            workspace_id,
            input.client_id,
            title,
            input.note,
            input.due_at,
            status,
            input.recurrence_rule,
            now,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    get_reminder(db, id)
}

#[tauri::command]
pub fn get_reminder(db: tauri::State<'_, AppDb>, id: String) -> Result<ClientReminderRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, workspace_id, client_id, title, note, due_at, status, recurrence_rule, created_at, updated_at \
         FROM client_reminders WHERE id = ?1",
        [&id],
        |row| {
            Ok(ClientReminderRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                client_id: row.get(2)?,
                title: row.get(3)?,
                note: row.get(4)?,
                due_at: row.get(5)?,
                status: row.get(6)?,
                recurrence_rule: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_reminder(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: ClientReminderInput,
) -> Result<ClientReminderRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let ws: String = conn
        .query_row(
            "SELECT workspace_id FROM client_reminders WHERE id = ?1",
            [&id],
            |r| r.get(0),
        )
        .map_err(|_| "Rappel introuvable.".to_string())?;
    if let Some(ref cid) = input.client_id {
        ensure_client_in_workspace(&conn, &ws, cid)?;
    }
    let now = Utc::now().to_rfc3339();
    let title = input.title.trim().to_string();
    if title.is_empty() {
        return Err("Titre obligatoire.".into());
    }
    let status = input
        .status
        .unwrap_or_else(|| "pending".into())
        .trim()
        .to_string();
    conn.execute(
        "UPDATE client_reminders SET client_id = ?1, title = ?2, note = ?3, due_at = ?4, status = ?5, recurrence_rule = ?6, updated_at = ?7 WHERE id = ?8",
        params![
            input.client_id,
            title,
            input.note,
            input.due_at,
            status,
            input.recurrence_rule,
            now,
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    get_reminder(db, id)
}

#[tauri::command]
pub fn delete_reminder(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM client_reminders WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
