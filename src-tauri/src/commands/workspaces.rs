use crate::db::AppDb;
use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use super::types::{WorkspaceInput, WorkspaceRow};

/// Taux insérés à la création d’un workspace selon `country_code` (majuscules).
fn default_tax_rates_for_country(country_upper: &str) -> Vec<(&'static str, f64)> {
    match country_upper {
        "FR" => vec![
            ("TVA normale", 20.0),
            ("TVA intermédiaire", 10.0),
            ("TVA réduite", 5.5),
        ],
        "CH" => vec![
            ("TVA 8,1 % (normal)", 8.1),
            ("TVA 2,6 % (réduit)", 2.6),
            ("TVA 3,7 % (hébergement)", 3.7),
        ],
        _ => vec![],
    }
}

#[tauri::command]
pub fn list_workspaces(db: tauri::State<'_, AppDb>) -> Result<Vec<WorkspaceRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, entity_type, country_code, profile_json, base_currency, theme, pdf_output_dir, created_at, updated_at FROM workspaces ORDER BY name",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(WorkspaceRow {
                id: row.get(0)?,
                name: row.get(1)?,
                entity_type: row.get(2)?,
                country_code: row.get(3)?,
                profile_json: row.get(4)?,
                base_currency: row.get(5)?,
                theme: row.get(6)?,
                pdf_output_dir: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_workspace(
    db: tauri::State<'_, AppDb>,
    input: WorkspaceInput,
) -> Result<WorkspaceRow, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let profile = serde_json::to_string(&input.profile_json).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO workspaces (id, name, entity_type, country_code, profile_json, base_currency, theme, pdf_output_dir, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,'system',?7,?8,?9)",
        params![
            id,
            input.name,
            input.entity_type,
            input.country_code,
            profile,
            input.base_currency,
            input.pdf_output_dir,
            now,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    let country_upper = input.country_code.trim().to_ascii_uppercase();
    for (name, rate) in default_tax_rates_for_country(country_upper.as_str()) {
        let tr_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO tax_rates (id, workspace_id, name, rate, is_default) VALUES (?1, ?2, ?3, ?4, 0)",
            params![tr_id, id, name, rate],
        )
        .map_err(|e| e.to_string())?;
    }
    drop(conn);
    get_workspace(db, id)
}

#[tauri::command]
pub fn update_workspace(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: WorkspaceInput,
) -> Result<WorkspaceRow, String> {
    let now = Utc::now().to_rfc3339();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let profile = serde_json::to_string(&input.profile_json).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE workspaces SET name=?1, entity_type=?2, country_code=?3, profile_json=?4, base_currency=?5, pdf_output_dir=?6, updated_at=?7 WHERE id=?8",
        params![
            input.name,
            input.entity_type,
            input.country_code,
            profile,
            input.base_currency,
            input.pdf_output_dir,
            now,
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    get_workspace(db, id)
}

#[tauri::command]
pub fn update_workspace_theme(
    db: tauri::State<'_, AppDb>,
    id: String,
    theme: String,
) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE workspaces SET theme=?1, updated_at=?2 WHERE id=?3",
        params![theme, now, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_workspace(db: tauri::State<'_, AppDb>, id: String) -> Result<WorkspaceRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, name, entity_type, country_code, profile_json, base_currency, theme, pdf_output_dir, created_at, updated_at FROM workspaces WHERE id = ?1",
        [&id],
        |row| {
            Ok(WorkspaceRow {
                id: row.get(0)?,
                name: row.get(1)?,
                entity_type: row.get(2)?,
                country_code: row.get(3)?,
                profile_json: row.get(4)?,
                base_currency: row.get(5)?,
                theme: row.get(6)?,
                pdf_output_dir: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_workspace(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM workspaces WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
