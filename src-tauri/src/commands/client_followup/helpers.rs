use chrono::Utc;
use rusqlite::{params, Connection};
use serde_json::json;

use super::super::types::FollowupScoringSettings;

pub(crate) fn parse_iso_day(iso: &str) -> Option<chrono::NaiveDate> {
    let d = iso.get(..10)?;
    chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()
}

pub(crate) fn parse_iso_datetime_day(iso: &str) -> Option<chrono::NaiveDate> {
    if let Some(d) = parse_iso_day(iso) {
        return Some(d);
    }
    chrono::DateTime::parse_from_rfc3339(iso)
        .ok()
        .map(|dt| dt.date_naive())
}

pub(crate) fn today_naive() -> chrono::NaiveDate {
    chrono::Utc::now().date_naive()
}

pub(crate) fn ensure_client_in_workspace(
    conn: &Connection,
    workspace_id: &str,
    client_id: &str,
) -> Result<(), String> {
    let n: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM clients WHERE id = ?1 AND workspace_id = ?2",
            params![client_id, workspace_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Client introuvable dans cet espace.".into());
    }
    Ok(())
}

pub(crate) fn load_followup_settings(
    conn: &Connection,
    workspace_id: &str,
) -> Result<FollowupScoringSettings, String> {
    let pj: String = conn
        .query_row(
            "SELECT profile_json FROM workspaces WHERE id = ?1",
            [workspace_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    let root: serde_json::Value = serde_json::from_str(&pj).unwrap_or_else(|_| json!({}));
    let fs = root
        .get("followupScoring")
        .cloned()
        .unwrap_or(serde_json::Value::Null);
    Ok(serde_json::from_value(fs).unwrap_or_default())
}

pub(crate) fn merge_followup_into_profile(
    conn: &Connection,
    workspace_id: &str,
    patch: serde_json::Value,
) -> Result<FollowupScoringSettings, String> {
    let pj: String = conn
        .query_row(
            "SELECT profile_json FROM workspaces WHERE id = ?1",
            [workspace_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    let mut root: serde_json::Value = serde_json::from_str(&pj).unwrap_or_else(|_| json!({}));
    let obj = root.as_object_mut().ok_or("profile_json invalide")?;
    let current = obj
        .entry("followupScoring".to_string())
        .or_insert(json!({}))
        .as_object_mut()
        .ok_or("followupScoring invalide")?;
    if let Some(p) = patch.as_object() {
        for (k, v) in p {
            current.insert(k.clone(), v.clone());
        }
    }
    let merged: FollowupScoringSettings =
        serde_json::from_value(json!(current)).unwrap_or_default();
    let now = Utc::now().to_rfc3339();
    let out = serde_json::to_string(&root).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE workspaces SET profile_json = ?1, updated_at = ?2 WHERE id = ?3",
        params![out, now, workspace_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(merged)
}
