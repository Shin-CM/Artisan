use crate::db::AppDb;
use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use super::types::{ImportHistoryRow, PluginRow};

#[tauri::command]
pub fn log_import_history(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    source_type: String,
    module: String,
    file_name: Option<String>,
    record_count: i64,
    status: String,
) -> Result<(), String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO import_history (id, workspace_id, source_type, module, file_name, record_count, status, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![
            id,
            workspace_id,
            source_type,
            module,
            file_name,
            record_count,
            status,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_import_history(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<ImportHistoryRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, workspace_id, source_type, module, file_name, record_count, status, created_at FROM import_history WHERE workspace_id = ?1 ORDER BY created_at DESC LIMIT 100")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |row| {
            Ok(ImportHistoryRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                source_type: row.get(2)?,
                module: row.get(3)?,
                file_name: row.get(4)?,
                record_count: row.get(5)?,
                status: row.get(6)?,
                created_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn register_plugin_manifest(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    manifest_json: String,
) -> Result<PluginRow, String> {
    let id = Uuid::new_v4().to_string();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO plugin_registry (id, workspace_id, manifest_json, enabled) VALUES (?1,?2,?3,1)",
        params![id, workspace_id, manifest_json],
    )
    .map_err(|e| e.to_string())?;
    Ok(PluginRow {
        id,
        workspace_id,
        manifest_json,
        enabled: true,
    })
}

#[tauri::command]
pub fn list_plugins(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<PluginRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, workspace_id, manifest_json, enabled FROM plugin_registry WHERE workspace_id = ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |row| {
            Ok(PluginRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                manifest_json: row.get(2)?,
                enabled: row.get::<_, i64>(3)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_plugin_enabled(
    db: tauri::State<'_, AppDb>,
    plugin_id: String,
    enabled: bool,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE plugin_registry SET enabled = ?1 WHERE id = ?2",
        params![if enabled { 1i32 } else { 0i32 }, plugin_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
