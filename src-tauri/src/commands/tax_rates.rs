use crate::db::AppDb;
use rusqlite::{params, Connection};
use uuid::Uuid;

use super::types::{TaxRateInput, TaxRateRow};

pub(crate) fn list_tax_rates_conn(
    conn: &Connection,
    workspace_id: &str,
) -> Result<Vec<TaxRateRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, name, rate, is_default FROM tax_rates WHERE workspace_id = ?1 ORDER BY rate DESC, name",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([workspace_id], |row| {
            Ok(TaxRateRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                rate: row.get(3)?,
                is_default: row.get::<_, i64>(4)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_tax_rates(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<TaxRateRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    list_tax_rates_conn(&conn, &workspace_id)
}

#[tauri::command]
pub fn create_tax_rate(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: TaxRateInput,
) -> Result<TaxRateRow, String> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err("Indiquez un libellé pour le taux.".into());
    }
    if !input.rate.is_finite() || input.rate < 0.0 || input.rate > 100.0 {
        return Err("Le taux doit être un pourcentage entre 0 et 100.".into());
    }
    let id = Uuid::new_v4().to_string();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO tax_rates (id, workspace_id, name, rate, is_default) VALUES (?1, ?2, ?3, ?4, 0)",
        params![id, workspace_id, name, input.rate],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    get_tax_rate(db, id)
}

#[tauri::command]
pub fn delete_tax_rate(
    db: tauri::State<'_, AppDb>,
    id: String,
    workspace_id: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let n = conn
        .execute(
            "DELETE FROM tax_rates WHERE id = ?1 AND workspace_id = ?2",
            params![id, workspace_id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Taux introuvable.".into());
    }
    Ok(())
}

fn get_tax_rate(db: tauri::State<'_, AppDb>, id: String) -> Result<TaxRateRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, workspace_id, name, rate, is_default FROM tax_rates WHERE id = ?1",
        [&id],
        |row| {
            Ok(TaxRateRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                rate: row.get(3)?,
                is_default: row.get::<_, i64>(4)? == 1,
            })
        },
    )
    .map_err(|e| e.to_string())
}
