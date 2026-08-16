use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use crate::db::AppDb;

use super::super::types::{ClientTagInput, ClientTagRow};
use super::helpers::ensure_client_in_workspace;

#[tauri::command]
pub fn list_client_tags(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<ClientTagRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, name, color, created_at FROM client_tags WHERE workspace_id = ?1 ORDER BY name",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |row| {
            Ok(ClientTagRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                color: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_client_tag(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: ClientTagInput,
) -> Result<ClientTagRow, String> {
    let name = input.name.trim().to_string();
    if name.is_empty() {
        return Err("Nom du tag obligatoire.".into());
    }
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO client_tags (id, workspace_id, name, color, created_at) VALUES (?1,?2,?3,?4,?5)",
        params![id, workspace_id, name, input.color, now],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, workspace_id, name, color, created_at FROM client_tags WHERE id = ?1",
        [&id],
        |row| {
            Ok(ClientTagRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                color: row.get(3)?,
                created_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_client_tag(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM client_tags WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_client_tags(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    client_id: String,
    tag_ids: Vec<String>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    ensure_client_in_workspace(&conn, &workspace_id, &client_id)?;
    for tid in &tag_ids {
        let n: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM client_tags WHERE id = ?1 AND workspace_id = ?2",
                params![tid, workspace_id],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if n == 0 {
            return Err("Tag invalide.".into());
        }
    }
    conn.execute(
        "DELETE FROM client_tag_links WHERE client_id = ?1",
        [&client_id],
    )
    .map_err(|e| e.to_string())?;
    for tid in tag_ids {
        conn.execute(
            "INSERT OR IGNORE INTO client_tag_links (client_id, tag_id) VALUES (?1, ?2)",
            params![client_id, tid],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}
