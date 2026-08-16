use crate::db::AppDb;
use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use super::types::{ManualRevenueInput, ManualRevenueRow};

fn validate_ym(year: i32, month: i32) -> Result<(), String> {
    if !(1900..=2100).contains(&year) {
        return Err("Année invalide.".into());
    }
    if !(1..=12).contains(&month) {
        return Err("Mois invalide (1–12).".into());
    }
    Ok(())
}

#[tauri::command]
pub fn list_manual_revenue_entries(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<ManualRevenueRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, year, month, amount, currency, notes, created_at, updated_at \
             FROM manual_revenue_entries WHERE workspace_id = ?1 ORDER BY year DESC, month DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |row| {
            Ok(ManualRevenueRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                year: row.get(2)?,
                month: row.get(3)?,
                amount: row.get(4)?,
                currency: row.get(5)?,
                notes: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn upsert_manual_revenue_entry(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: ManualRevenueInput,
) -> Result<ManualRevenueRow, String> {
    validate_ym(input.year, input.month)?;
    if !input.amount.is_finite() || input.amount < 0.0 {
        return Err("Montant invalide.".into());
    }
    let currency = input.currency.trim();
    let currency = if currency.is_empty() { "EUR" } else { currency };
    let notes = input
        .notes
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    let existing_id: Option<String> = conn
        .query_row(
            "SELECT id FROM manual_revenue_entries WHERE workspace_id = ?1 AND year = ?2 AND month = ?3",
            params![workspace_id, input.year, input.month],
            |r| r.get(0),
        )
        .ok();

    let id = existing_id.unwrap_or_else(|| Uuid::new_v4().to_string());

    conn.execute(
        "INSERT INTO manual_revenue_entries (id, workspace_id, year, month, amount, currency, notes, created_at, updated_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9) \
         ON CONFLICT(workspace_id, year, month) DO UPDATE SET \
         amount = excluded.amount, currency = excluded.currency, notes = excluded.notes, updated_at = excluded.updated_at",
        params![
            id,
            workspace_id,
            input.year,
            input.month,
            input.amount,
            currency,
            notes,
            now.clone(),
            now
        ],
    )
    .map_err(|e| e.to_string())?;

    let row = conn
        .query_row(
            "SELECT id, workspace_id, year, month, amount, currency, notes, created_at, updated_at \
             FROM manual_revenue_entries WHERE workspace_id = ?1 AND year = ?2 AND month = ?3",
            params![workspace_id, input.year, input.month],
            |row| {
                Ok(ManualRevenueRow {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    year: row.get(2)?,
                    month: row.get(3)?,
                    amount: row.get(4)?,
                    currency: row.get(5)?,
                    notes: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub fn delete_manual_revenue_entry(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    id: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let n = conn
        .execute(
            "DELETE FROM manual_revenue_entries WHERE id = ?1 AND workspace_id = ?2",
            params![id, workspace_id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("Entrée introuvable.".into());
    }
    Ok(())
}
