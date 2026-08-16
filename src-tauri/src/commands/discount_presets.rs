use crate::db::AppDb;
use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use super::document_discount::normalize_discount_kind;
use super::types::{DiscountPresetInput, DiscountPresetRow};

#[tauri::command]
pub fn list_discount_presets(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<DiscountPresetRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, name, kind, value, sort_order, created_at, updated_at FROM discount_presets WHERE workspace_id = ?1 ORDER BY sort_order, name",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |row| {
            Ok(DiscountPresetRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                kind: row.get(3)?,
                value: row.get(4)?,
                sort_order: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_discount_preset(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: DiscountPresetInput,
) -> Result<DiscountPresetRow, String> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err("Indiquez un nom pour le modèle.".into());
    }
    let kind = normalize_discount_kind(Some(&input.kind));
    if kind == "none" {
        return Err("Choisissez un type : pourcentage ou montant fixe.".into());
    }
    if !input.value.is_finite() || input.value < 0.0 {
        return Err("La valeur de réduction doit être un nombre positif.".into());
    }
    if kind == "percent" && input.value > 100.0 {
        return Err("Le pourcentage ne peut pas dépasser 100.".into());
    }
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let next_sort: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM discount_presets WHERE workspace_id = ?1",
            [&workspace_id],
            |row| row.get(0),
        )
        .unwrap_or(0);
    conn.execute(
        "INSERT INTO discount_presets (id, workspace_id, name, kind, value, sort_order, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        params![
            id,
            workspace_id,
            name,
            kind,
            input.value,
            next_sort,
            now,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    get_discount_preset(db, id)
}

#[tauri::command]
pub fn update_discount_preset(
    db: tauri::State<'_, AppDb>,
    id: String,
    workspace_id: String,
    input: DiscountPresetInput,
) -> Result<DiscountPresetRow, String> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err("Indiquez un nom pour le modèle.".into());
    }
    let kind = normalize_discount_kind(Some(&input.kind));
    if kind == "none" {
        return Err("Choisissez un type : pourcentage ou montant fixe.".into());
    }
    if !input.value.is_finite() || input.value < 0.0 {
        return Err("La valeur de réduction doit être un nombre positif.".into());
    }
    if kind == "percent" && input.value > 100.0 {
        return Err("Le pourcentage ne peut pas dépasser 100.".into());
    }
    let now = Utc::now().to_rfc3339();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let n = conn
        .execute(
            "UPDATE discount_presets SET name=?1, kind=?2, value=?3, updated_at=?4 WHERE id=?5 AND workspace_id=?6",
            params![name, kind, input.value, now, id, workspace_id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Modèle introuvable.".into());
    }
    drop(conn);
    get_discount_preset(db, id)
}

#[tauri::command]
pub fn delete_discount_preset(
    db: tauri::State<'_, AppDb>,
    id: String,
    workspace_id: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let n = conn
        .execute(
            "DELETE FROM discount_presets WHERE id = ?1 AND workspace_id = ?2",
            params![id, workspace_id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Modèle introuvable.".into());
    }
    Ok(())
}

fn get_discount_preset(
    db: tauri::State<'_, AppDb>,
    id: String,
) -> Result<DiscountPresetRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, workspace_id, name, kind, value, sort_order, created_at, updated_at FROM discount_presets WHERE id = ?1",
        [&id],
        |row| {
            Ok(DiscountPresetRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                kind: row.get(3)?,
                value: row.get(4)?,
                sort_order: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}
