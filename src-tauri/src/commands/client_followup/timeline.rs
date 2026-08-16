use chrono::NaiveDate;
use rusqlite::params;

use crate::db::AppDb;

use super::super::types::ClientTimelineEntry;
use super::helpers::{ensure_client_in_workspace, parse_iso_datetime_day};

#[tauri::command]
pub fn get_client_timeline(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    client_id: String,
) -> Result<Vec<ClientTimelineEntry>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    ensure_client_in_workspace(&conn, &workspace_id, &client_id)?;
    let mut entries: Vec<ClientTimelineEntry> = Vec::new();

    let mut stmt = conn
        .prepare(
            "SELECT id, number, COALESCE(title,''), issue_date FROM quotes \
             WHERE workspace_id = ?1 AND client_id = ?2 ORDER BY issue_date DESC LIMIT 200",
        )
        .map_err(|e| e.to_string())?;
    let qrows = stmt
        .query_map(params![workspace_id, client_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    for r in qrows {
        let (id, num, title, issue) = r.map_err(|e| e.to_string())?;
        entries.push(ClientTimelineEntry {
            kind: "quote".into(),
            id,
            title: format!("Devis {num}"),
            subtitle: if title.is_empty() { None } else { Some(title) },
            occurred_at: issue + "T12:00:00Z",
            meta: Some("quote".into()),
        });
    }
    drop(stmt);

    let mut stmt = conn
        .prepare(
            "SELECT id, number, total, issue_date, document_kind FROM invoices \
             WHERE workspace_id = ?1 AND client_id = ?2 ORDER BY issue_date DESC LIMIT 200",
        )
        .map_err(|e| e.to_string())?;
    let irows = stmt
        .query_map(params![workspace_id, client_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, f64>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    for r in irows {
        let (id, num, total, issue, dk) = r.map_err(|e| e.to_string())?;
        let label = if dk == "credit_note" {
            format!("Avoir {num}")
        } else {
            format!("Facture {num}")
        };
        entries.push(ClientTimelineEntry {
            kind: if dk == "credit_note" {
                "credit_note"
            } else {
                "invoice"
            }
            .into(),
            id,
            title: label,
            subtitle: Some(format!("{total:.2}")),
            occurred_at: issue + "T12:00:00Z",
            meta: Some(dk),
        });
    }
    drop(stmt);

    let mut stmt = conn
        .prepare(
            "SELECT id, kind, body, occurred_at FROM client_contact_events \
             WHERE workspace_id = ?1 AND client_id = ?2 ORDER BY occurred_at DESC LIMIT 200",
        )
        .map_err(|e| e.to_string())?;
    let erows = stmt
        .query_map(params![workspace_id, client_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, String>(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    for r in erows {
        let (id, kind, body, occ) = r.map_err(|e| e.to_string())?;
        entries.push(ClientTimelineEntry {
            kind: "contact_event".into(),
            id,
            title: format!("Contact ({kind})"),
            subtitle: body,
            occurred_at: occ,
            meta: Some(kind),
        });
    }
    drop(stmt);

    let mut stmt = conn
        .prepare(
            "SELECT id, title, due_at, status FROM client_reminders \
             WHERE workspace_id = ?1 AND client_id = ?2 ORDER BY due_at DESC LIMIT 100",
        )
        .map_err(|e| e.to_string())?;
    let rrows = stmt
        .query_map(params![workspace_id, client_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    for r in rrows {
        let (id, title, due, st) = r.map_err(|e| e.to_string())?;
        entries.push(ClientTimelineEntry {
            kind: "reminder".into(),
            id,
            title,
            subtitle: Some(st),
            occurred_at: due + "T12:00:00Z",
            meta: Some("reminder".into()),
        });
    }
    drop(stmt);

    let mut stmt = conn
        .prepare(
            "SELECT id, title, stage, updated_at FROM crm_opportunities \
             WHERE workspace_id = ?1 AND client_id = ?2 ORDER BY updated_at DESC LIMIT 50",
        )
        .map_err(|e| e.to_string())?;
    let crows = stmt
        .query_map(params![workspace_id, client_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    for r in crows {
        let (id, title, stage, upd) = r.map_err(|e| e.to_string())?;
        entries.push(ClientTimelineEntry {
            kind: "crm_opportunity".into(),
            id,
            title,
            subtitle: Some(stage),
            occurred_at: upd,
            meta: Some("crm".into()),
        });
    }

    entries.sort_by(|a, b| {
        let da = parse_iso_datetime_day(&a.occurred_at)
            .unwrap_or(NaiveDate::from_ymd_opt(1970, 1, 1).unwrap());
        let db_ = parse_iso_datetime_day(&b.occurred_at)
            .unwrap_or(NaiveDate::from_ymd_opt(1970, 1, 1).unwrap());
        db_.cmp(&da)
    });
    Ok(entries)
}
