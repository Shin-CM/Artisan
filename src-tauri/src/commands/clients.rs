use crate::db::AppDb;
use chrono::Utc;
use rusqlite::{params, Connection};
use uuid::Uuid;

use super::types::{ClientInput, ClientRow};

fn row_from_sql(row: &rusqlite::Row<'_>) -> rusqlite::Result<ClientRow> {
    Ok(ClientRow {
        id: row.get(0)?,
        workspace_id: row.get(1)?,
        name: row.get(2)?,
        email: row.get(3)?,
        phone: row.get(4)?,
        address_json: row.get(5)?,
        notes: row.get(6)?,
        details_json: row.get(7)?,
        sort_order: row.get(8)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

pub(crate) fn list_clients_conn(
    conn: &Connection,
    workspace_id: &str,
) -> Result<Vec<ClientRow>, String> {
    let mut stmt = conn
        .prepare("SELECT id, workspace_id, name, email, phone, address_json, notes, details_json, sort_order, created_at, updated_at FROM clients WHERE workspace_id = ?1 ORDER BY sort_order, name")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([workspace_id], row_from_sql)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

pub(crate) fn get_client_conn(conn: &Connection, id: &str) -> Result<ClientRow, String> {
    conn.query_row(
        "SELECT id, workspace_id, name, email, phone, address_json, notes, details_json, sort_order, created_at, updated_at FROM clients WHERE id = ?1",
        [id],
        row_from_sql,
    )
    .map_err(|e| e.to_string())
}

pub(crate) fn create_client_conn(
    conn: &Connection,
    workspace_id: &str,
    input: ClientInput,
) -> Result<ClientRow, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let addr = input
        .address_json
        .as_ref()
        .map(|v| serde_json::to_string(v).unwrap_or_default());
    let det = input
        .details_json
        .as_ref()
        .map(|v| serde_json::to_string(v).unwrap_or_default());
    let next_sort: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM clients WHERE workspace_id = ?1",
            [workspace_id],
            |row| row.get(0),
        )
        .unwrap_or(0);
    conn.execute(
        "INSERT INTO clients (id, workspace_id, name, email, phone, address_json, notes, details_json, sort_order, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
        params![
            id,
            workspace_id,
            input.name,
            input.email,
            input.phone,
            addr,
            input.notes,
            det,
            next_sort,
            now,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    get_client_conn(conn, &id)
}

#[tauri::command]
pub fn list_clients(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<ClientRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    list_clients_conn(&conn, &workspace_id)
}

#[tauri::command]
pub fn create_client(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: ClientInput,
) -> Result<ClientRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    create_client_conn(&conn, &workspace_id, input)
}

#[tauri::command]
pub fn get_client(db: tauri::State<'_, AppDb>, id: String) -> Result<ClientRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_client_conn(&conn, &id)
}

#[tauri::command]
pub fn update_client(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: ClientInput,
) -> Result<ClientRow, String> {
    let now = Utc::now().to_rfc3339();
    let addr = input
        .address_json
        .as_ref()
        .map(|v| serde_json::to_string(v).unwrap_or_default());
    let det = input
        .details_json
        .as_ref()
        .map(|v| serde_json::to_string(v).unwrap_or_default());
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE clients SET name=?1, email=?2, phone=?3, address_json=?4, notes=?5, details_json=?6, updated_at=?7 WHERE id=?8",
        params![
            input.name,
            input.email,
            input.phone,
            addr,
            input.notes,
            det,
            now,
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    get_client(db, id)
}

#[tauri::command]
pub fn delete_client(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM clients WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reorder_clients(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    ordered_ids: Vec<String>,
) -> Result<(), String> {
    let mut conn = db.conn.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    for (i, id) in ordered_ids.iter().enumerate() {
        let n = tx
            .execute(
                "UPDATE clients SET sort_order = ?1, updated_at = ?2 WHERE id = ?3 AND workspace_id = ?4",
                params![i as i64, now, id, workspace_id],
            )
            .map_err(|e| e.to_string())?;
        if n != 1 {
            return Err(format!("Client introuvable : {}", id));
        }
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
