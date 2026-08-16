use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use crate::db::AppDb;

use super::super::types::{ClientContactEventInput, ClientContactEventRow};
use super::helpers::ensure_client_in_workspace;

fn normalize_contact_kind(raw: &str) -> &'static str {
    match raw.trim().to_lowercase().as_str() {
        "call" | "appel" => "call",
        "email" | "mail" => "email",
        "meeting" | "rdv" | "rendez-vous" => "meeting",
        "note" => "note",
        _ => "note",
    }
}

#[tauri::command]
pub fn list_contact_events(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    client_id: String,
) -> Result<Vec<ClientContactEventRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    ensure_client_in_workspace(&conn, &workspace_id, &client_id)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, client_id, kind, body, occurred_at, created_at, updated_at \
             FROM client_contact_events WHERE workspace_id = ?1 AND client_id = ?2 \
             ORDER BY occurred_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![workspace_id, client_id], |row| {
            Ok(ClientContactEventRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                client_id: row.get(2)?,
                kind: row.get(3)?,
                body: row.get(4)?,
                occurred_at: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_contact_event(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    client_id: String,
    input: ClientContactEventInput,
) -> Result<ClientContactEventRow, String> {
    let kind = normalize_contact_kind(&input.kind).to_string();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    ensure_client_in_workspace(&conn, &workspace_id, &client_id)?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO client_contact_events (id, workspace_id, client_id, kind, body, occurred_at, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![
            id,
            workspace_id,
            client_id,
            kind,
            input.body,
            input.occurred_at,
            now,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    get_contact_event(db, id)
}

#[tauri::command]
pub fn get_contact_event(
    db: tauri::State<'_, AppDb>,
    id: String,
) -> Result<ClientContactEventRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, workspace_id, client_id, kind, body, occurred_at, created_at, updated_at \
         FROM client_contact_events WHERE id = ?1",
        [&id],
        |row| {
            Ok(ClientContactEventRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                client_id: row.get(2)?,
                kind: row.get(3)?,
                body: row.get(4)?,
                occurred_at: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_contact_event(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    id: String,
    input: ClientContactEventInput,
) -> Result<ClientContactEventRow, String> {
    let kind = normalize_contact_kind(&input.kind).to_string();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let n = conn
        .execute(
            "UPDATE client_contact_events SET kind = ?1, body = ?2, occurred_at = ?3, updated_at = ?4 \
             WHERE id = ?5 AND workspace_id = ?6",
            params![
                kind,
                input.body,
                input.occurred_at,
                now,
                id,
                workspace_id
            ],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Événement introuvable.".into());
    }
    drop(conn);
    get_contact_event(db, id)
}

#[tauri::command]
pub fn delete_contact_event(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM client_contact_events WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
