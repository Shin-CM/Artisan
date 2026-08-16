use crate::db::AppDb;

use super::super::types::FollowupScoringSettings;
use super::helpers::{load_followup_settings, merge_followup_into_profile};

#[tauri::command]
pub fn get_followup_settings(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<FollowupScoringSettings, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    load_followup_settings(&conn, &workspace_id)
}

#[tauri::command]
pub fn update_followup_settings(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    patch: serde_json::Value,
) -> Result<FollowupScoringSettings, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    merge_followup_into_profile(&conn, &workspace_id, patch)
}
