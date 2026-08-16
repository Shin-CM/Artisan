use chrono::{Duration, NaiveDate};
use rusqlite::params;

use crate::db::AppDb;

use super::super::types::{ClientFollowupRow, ClientTagBrief, ListClientsFollowupInput};
use super::helpers::{load_followup_settings, parse_iso_datetime_day, parse_iso_day, today_naive};
use super::scoring::{
    compute_followup_score, median_interval_days, priority_level, INVOICE_STATUSES_CA,
};

#[tauri::command]
pub fn list_clients_followup(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: ListClientsFollowupInput,
) -> Result<Vec<ClientFollowupRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let settings = load_followup_settings(&conn, &workspace_id)?;
    let today = today_naive();

    let value_cutoff = today - Duration::days(i64::from(settings.value_months) * 30);
    let value_cutoff_s = value_cutoff.format("%Y-%m-%d").to_string();

    let lookback_days = settings.period_lookback_days as i64;
    let period_cutoff = today - Duration::days(lookback_days);
    let period_cutoff_s = period_cutoff.format("%Y-%m-%d").to_string();

    let mut stmt = conn
        .prepare(
            &format!(
                "SELECT client_id, COALESCE(SUM(CASE WHEN document_kind = 'credit_note' THEN -total ELSE total END), 0) \
                 FROM invoices WHERE workspace_id = ?1 AND client_id IS NOT NULL \
                 AND status IN {INVOICE_STATUSES_CA} AND issue_date >= ?2 GROUP BY client_id"
            ),
        )
        .map_err(|e| e.to_string())?;
    let revenue_rows = stmt
        .query_map(params![workspace_id, value_cutoff_s], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, f64>(1)?))
        })
        .map_err(|e| e.to_string())?;
    let mut revenue_by_client: std::collections::HashMap<String, f64> =
        std::collections::HashMap::new();
    for r in revenue_rows {
        let (cid, amt) = r.map_err(|e| e.to_string())?;
        revenue_by_client.insert(cid, amt);
    }
    drop(stmt);

    let mut stmt = conn
        .prepare(&format!(
            "SELECT client_id, COUNT(*) FROM invoices WHERE workspace_id = ?1 \
                 AND document_kind = 'invoice' AND client_id IS NOT NULL \
                 AND status IN {INVOICE_STATUSES_CA} AND issue_date >= ?2 GROUP BY client_id"
        ))
        .map_err(|e| e.to_string())?;
    let count_rows = stmt
        .query_map(params![workspace_id, value_cutoff_s], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })
        .map_err(|e| e.to_string())?;
    let mut count_by_client: std::collections::HashMap<String, i64> =
        std::collections::HashMap::new();
    for r in count_rows {
        let (cid, n) = r.map_err(|e| e.to_string())?;
        count_by_client.insert(cid, n);
    }
    drop(stmt);

    let mut stmt = conn
        .prepare(
            "SELECT client_id, issue_date FROM invoices WHERE workspace_id = ?1 \
             AND document_kind = 'invoice' AND client_id IS NOT NULL \
             AND issue_date >= ?2 ORDER BY client_id, issue_date",
        )
        .map_err(|e| e.to_string())?;
    let inv_dates_rows = stmt
        .query_map(params![workspace_id, period_cutoff_s], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;
    let mut invoices_by_client: std::collections::HashMap<String, Vec<NaiveDate>> =
        std::collections::HashMap::new();
    for r in inv_dates_rows {
        let (cid, d_s) = r.map_err(|e| e.to_string())?;
        if let Some(d) = parse_iso_day(&d_s) {
            invoices_by_client.entry(cid).or_default().push(d);
        }
    }
    drop(stmt);

    let mut stmt = conn
        .prepare(
            "SELECT client_id, MAX(issue_date) FROM quotes WHERE workspace_id = ?1 \
             AND client_id IS NOT NULL GROUP BY client_id",
        )
        .map_err(|e| e.to_string())?;
    let qrows = stmt
        .query_map([&workspace_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;
    let mut last_quote: std::collections::HashMap<String, String> =
        std::collections::HashMap::new();
    for r in qrows {
        let (cid, dt) = r.map_err(|e| e.to_string())?;
        last_quote.insert(cid, dt);
    }
    drop(stmt);

    let mut stmt = conn
        .prepare(
            "SELECT client_id, MAX(issue_date) FROM invoices WHERE workspace_id = ?1 \
             AND document_kind = 'invoice' AND client_id IS NOT NULL GROUP BY client_id",
        )
        .map_err(|e| e.to_string())?;
    let irows = stmt
        .query_map([&workspace_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;
    let mut last_invoice: std::collections::HashMap<String, String> =
        std::collections::HashMap::new();
    for r in irows {
        let (cid, dt) = r.map_err(|e| e.to_string())?;
        last_invoice.insert(cid, dt);
    }
    drop(stmt);

    let mut stmt = conn
        .prepare(
            "SELECT client_id, MAX(occurred_at) FROM client_contact_events \
             WHERE workspace_id = ?1 GROUP BY client_id",
        )
        .map_err(|e| e.to_string())?;
    let erows = stmt
        .query_map([&workspace_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;
    let mut last_event: std::collections::HashMap<String, String> =
        std::collections::HashMap::new();
    for r in erows {
        let (cid, dt) = r.map_err(|e| e.to_string())?;
        last_event.insert(cid, dt);
    }
    drop(stmt);

    let mut stmt = conn
        .prepare(
            "SELECT ctl.client_id, ct.id, ct.name, ct.color FROM client_tag_links ctl \
             INNER JOIN client_tags ct ON ct.id = ctl.tag_id WHERE ct.workspace_id = ?1",
        )
        .map_err(|e| e.to_string())?;
    let tag_rows = stmt
        .query_map([&workspace_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    let mut tags_by_client: std::collections::HashMap<String, Vec<ClientTagBrief>> =
        std::collections::HashMap::new();
    for r in tag_rows {
        let (cid, tid, name, color) = r.map_err(|e| e.to_string())?;
        tags_by_client.entry(cid).or_default().push(ClientTagBrief {
            id: tid,
            name,
            color,
        });
    }
    drop(stmt);

    let mut stmt = conn
        .prepare(
            "SELECT id, name, created_at FROM clients WHERE workspace_id = ?1 ORDER BY sort_order, name",
        )
        .map_err(|e| e.to_string())?;
    let clients = stmt
        .query_map([&workspace_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    let mut rows: Vec<ClientFollowupRow> = Vec::new();
    for c in clients {
        let (id, name, created_s) = c.map_err(|e| e.to_string())?;
        if let Some(ref q) = input.search {
            let q = q.trim().to_lowercase();
            if !q.is_empty() && !name.to_lowercase().contains(&q) {
                continue;
            }
        }
        if let Some(ref tid) = input.tag_id {
            let tags = tags_by_client.get(&id);
            let has = tags
                .map(|t| t.iter().any(|x| x.id == *tid))
                .unwrap_or(false);
            if !has {
                continue;
            }
        }

        let lq = last_quote.get(&id).cloned();
        let li = last_invoice.get(&id).cloned();
        let le = last_event.get(&id).cloned();

        let dates_for_last: Vec<NaiveDate> = vec![lq.as_deref(), li.as_deref(), le.as_deref()]
            .into_iter()
            .flatten()
            .filter_map(parse_iso_day)
            .collect();
        let created_day = parse_iso_datetime_day(&created_s).unwrap_or(today);

        let last_touch_day = dates_for_last.into_iter().max().unwrap_or(created_day);

        let days_since = (today - last_touch_day).num_days();

        let inv_dates = invoices_by_client.get(&id).cloned().unwrap_or_default();
        let expected_period = if inv_dates.len() >= settings.min_invoices_for_period as usize {
            median_interval_days(&inv_dates)
        } else {
            None
        };

        let intervals_f: Vec<f64> = inv_dates
            .windows(2)
            .map(|w| w[1].signed_duration_since(w[0]).num_days().abs() as f64)
            .collect();

        let revenue = *revenue_by_client.get(&id).unwrap_or(&0.0);
        let inv_count = *count_by_client.get(&id).unwrap_or(&0);

        let tenure_days = (today - created_day).num_days();

        let score = compute_followup_score(
            &settings,
            days_since,
            expected_period,
            revenue,
            &intervals_f,
            tenure_days,
        );
        let pl = priority_level(score);
        if let Some(ref want) = input.priority_level {
            let w = want.trim().to_lowercase();
            if !w.is_empty() && w != pl {
                continue;
            }
        }

        let tags = tags_by_client.get(&id).cloned().unwrap_or_default();

        rows.push(ClientFollowupRow {
            client_id: id,
            client_name: name,
            score,
            priority_level: pl.into(),
            days_since_last_touch: days_since,
            last_touch_at: Some(last_touch_day.format("%Y-%m-%d").to_string()),
            last_quote_at: lq,
            last_invoice_at: li,
            last_contact_event_at: le,
            expected_period_days: expected_period,
            revenue_value_period: revenue,
            invoice_count_in_period: inv_count,
            tags,
        });
    }

    rows.sort_by(|a, b| b.score.cmp(&a.score));
    Ok(rows)
}
