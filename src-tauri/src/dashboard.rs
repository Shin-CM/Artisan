use crate::db::AppDb;
use chrono::{Datelike, Utc};
use rusqlite::params;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardStats {
    pub revenue_total: f64,
    pub revenue_month: f64,
    pub revenue_year: f64,
    pub invoices_outstanding: i64,
    pub invoices_paid: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RevenueComparisonMonth {
    pub month: String,
    pub month_label: String,
    pub amounts: HashMap<i32, f64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RevenueComparisonResponse {
    pub years: Vec<i32>,
    pub months: Vec<RevenueComparisonMonth>,
}

fn month_label_fr(m: i32) -> &'static str {
    match m {
        1 => "janv.",
        2 => "févr.",
        3 => "mars",
        4 => "avr.",
        5 => "mai",
        6 => "juin",
        7 => "juil.",
        8 => "août",
        9 => "sept.",
        10 => "oct.",
        11 => "nov.",
        12 => "déc.",
        _ => "?",
    }
}

#[tauri::command]
pub fn get_dashboard_stats(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    period: String,
) -> Result<DashboardStats, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let total: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(CASE WHEN document_kind = 'credit_note' THEN -total ELSE total END), 0) FROM invoices WHERE workspace_id = ?1 AND status IN ('paid','partially_paid','partial','sent','issued')",
            [&workspace_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let month: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(CASE WHEN document_kind = 'credit_note' THEN -total ELSE total END), 0) FROM invoices WHERE workspace_id = ?1 AND status IN ('paid','partially_paid','partial','sent','issued') AND strftime('%Y-%m', issue_date) = strftime('%Y-%m', 'now')",
            [&workspace_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let year: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(CASE WHEN document_kind = 'credit_note' THEN -total ELSE total END), 0) FROM invoices WHERE workspace_id = ?1 AND status IN ('paid','partially_paid','partial','sent','issued') AND strftime('%Y', issue_date) = strftime('%Y', 'now')",
            [&workspace_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    let outstanding: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM invoices WHERE workspace_id = ?1 AND document_kind = 'invoice' AND status IN ('sent','issued','partially_paid','partial','overdue')",
            [&workspace_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let paid: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM invoices WHERE workspace_id = ?1 AND document_kind = 'invoice' AND status = 'paid'",
            [&workspace_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let _ = period;

    Ok(DashboardStats {
        revenue_total: total,
        revenue_month: month,
        revenue_year: year,
        invoices_outstanding: outstanding,
        invoices_paid: paid,
    })
}

/// CA mensuel par année calendaire (même logique de statuts que le tableau de bord).
#[tauri::command]
pub fn get_revenue_comparison(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    year_count: u32,
) -> Result<RevenueComparisonResponse, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let year_count = year_count.clamp(1, 6);
    let current_year = Utc::now().year();
    let min_year = current_year - (year_count as i32) + 1;

    let mut stmt = conn
        .prepare(
            "SELECT CAST(strftime('%Y', issue_date) AS INTEGER), CAST(strftime('%m', issue_date) AS INTEGER), COALESCE(SUM(CASE WHEN document_kind = 'credit_note' THEN -total ELSE total END), 0) \
             FROM invoices WHERE workspace_id = ?1 \
             AND status IN ('paid','partially_paid','partial','sent','issued') \
             AND CAST(strftime('%Y', issue_date) AS INTEGER) >= ?2 \
             GROUP BY 1, 2",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![workspace_id, min_year], |row| {
            Ok((
                row.get::<_, i32>(0)?,
                row.get::<_, i32>(1)?,
                row.get::<_, f64>(2)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut grid: HashMap<(i32, i32), f64> = HashMap::new();
    for r in rows {
        let (y, m, amt) = r.map_err(|e| e.to_string())?;
        grid.insert((y, m), amt);
    }
    drop(stmt);

    // Saisie manuelle : remplace le CA factures pour ce mois (Historique → CA manuel).
    let mut manual_stmt = conn
        .prepare(
            "SELECT year, month, amount FROM manual_revenue_entries \
             WHERE workspace_id = ?1 AND year >= ?2 AND year <= ?3",
        )
        .map_err(|e| e.to_string())?;
    let manual_rows = manual_stmt
        .query_map(params![workspace_id, min_year, current_year], |row| {
            Ok((
                row.get::<_, i32>(0)?,
                row.get::<_, i32>(1)?,
                row.get::<_, f64>(2)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    for r in manual_rows {
        let (y, m, amt) = r.map_err(|e| e.to_string())?;
        grid.insert((y, m), amt);
    }
    drop(manual_stmt);

    let mut years: Vec<i32> = (min_year..=current_year).collect();
    years.sort_unstable_by(|a, b| b.cmp(a));

    let mut months = Vec::with_capacity(12);
    for mm in 1..=12 {
        let mut amounts = HashMap::new();
        for y in min_year..=current_year {
            let v = grid.get(&(y, mm)).copied().unwrap_or(0.0);
            amounts.insert(y, v);
        }
        months.push(RevenueComparisonMonth {
            month: format!("{:02}", mm),
            month_label: month_label_fr(mm).to_string(),
            amounts,
        });
    }

    Ok(RevenueComparisonResponse { years, months })
}
