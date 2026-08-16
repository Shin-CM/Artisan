use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use crate::db::AppDb;

use super::types::{CalendarEventInput, CalendarEventRow};

/// Vérifie le format strict `YYYY-MM-DD` (date locale).
fn validate_iso_day(value: &str, field: &str) -> Result<(), String> {
    if value.len() != 10 {
        return Err(format!("Champ {field} : date invalide (YYYY-MM-DD attendu)."));
    }
    let bytes = value.as_bytes();
    let digits_ok = bytes[0].is_ascii_digit()
        && bytes[1].is_ascii_digit()
        && bytes[2].is_ascii_digit()
        && bytes[3].is_ascii_digit()
        && bytes[4] == b'-'
        && bytes[5].is_ascii_digit()
        && bytes[6].is_ascii_digit()
        && bytes[7] == b'-'
        && bytes[8].is_ascii_digit()
        && bytes[9].is_ascii_digit();
    if !digits_ok {
        return Err(format!("Champ {field} : date invalide (YYYY-MM-DD attendu)."));
    }
    Ok(())
}

fn validate_color_hex(value: &str) -> Result<(), String> {
    if value.len() != 7 || !value.starts_with('#') {
        return Err("Couleur hexadécimale invalide (#RRGGBB attendu).".into());
    }
    if !value.bytes().skip(1).all(|b| b.is_ascii_hexdigit()) {
        return Err("Couleur hexadécimale invalide (#RRGGBB attendu).".into());
    }
    Ok(())
}

fn normalize_input(input: &CalendarEventInput) -> Result<CalendarEventInput, String> {
    let title = input.title.trim().to_string();
    if title.is_empty() {
        return Err("Titre obligatoire.".into());
    }
    validate_iso_day(&input.start_date, "start_date")?;
    validate_iso_day(&input.end_date, "end_date")?;
    if input.end_date < input.start_date {
        return Err("La date de fin doit être >= à la date de début.".into());
    }
    if let Some(hex) = input.color_hex.as_deref() {
        if !hex.is_empty() {
            validate_color_hex(hex)?;
        }
    }
    let note = input
        .note
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let color_key = input
        .color_key
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let color_hex = input
        .color_hex
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let client_id = input.client_id.clone().filter(|s| !s.is_empty());
    let project_id = input.project_id.clone().filter(|s| !s.is_empty());
    let invoice_id = input.invoice_id.clone().filter(|s| !s.is_empty());
    Ok(CalendarEventInput {
        title,
        note,
        start_date: input.start_date.clone(),
        end_date: input.end_date.clone(),
        color_key,
        color_hex,
        client_id,
        project_id,
        invoice_id,
    })
}

#[tauri::command]
pub fn list_calendar_events(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<CalendarEventRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, title, note, start_date, end_date, color_key, color_hex, \
                    client_id, project_id, invoice_id, created_at, updated_at \
             FROM calendar_events WHERE workspace_id = ?1 ORDER BY start_date ASC, created_at ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |row| {
            Ok(CalendarEventRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                title: row.get(2)?,
                note: row.get(3)?,
                start_date: row.get(4)?,
                end_date: row.get(5)?,
                color_key: row.get(6)?,
                color_hex: row.get(7)?,
                client_id: row.get(8)?,
                project_id: row.get(9)?,
                invoice_id: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_calendar_event(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: CalendarEventInput,
) -> Result<CalendarEventRow, String> {
    let cleaned = normalize_input(&input)?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO calendar_events (id, workspace_id, title, note, start_date, end_date, \
                                       color_key, color_hex, client_id, project_id, invoice_id, \
                                       created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)",
        params![
            id,
            workspace_id,
            cleaned.title,
            cleaned.note,
            cleaned.start_date,
            cleaned.end_date,
            cleaned.color_key,
            cleaned.color_hex,
            cleaned.client_id,
            cleaned.project_id,
            cleaned.invoice_id,
            now,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    get_calendar_event(db, id)
}

#[tauri::command]
pub fn get_calendar_event(
    db: tauri::State<'_, AppDb>,
    id: String,
) -> Result<CalendarEventRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, workspace_id, title, note, start_date, end_date, color_key, color_hex, \
                client_id, project_id, invoice_id, created_at, updated_at \
         FROM calendar_events WHERE id = ?1",
        [&id],
        |row| {
            Ok(CalendarEventRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                title: row.get(2)?,
                note: row.get(3)?,
                start_date: row.get(4)?,
                end_date: row.get(5)?,
                color_key: row.get(6)?,
                color_hex: row.get(7)?,
                client_id: row.get(8)?,
                project_id: row.get(9)?,
                invoice_id: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        },
    )
    .map_err(|_| "Événement introuvable.".to_string())
}

#[tauri::command]
pub fn update_calendar_event(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: CalendarEventInput,
) -> Result<CalendarEventRow, String> {
    let cleaned = normalize_input(&input)?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let affected = conn
        .execute(
            "UPDATE calendar_events SET title = ?1, note = ?2, start_date = ?3, end_date = ?4, \
                                         color_key = ?5, color_hex = ?6, client_id = ?7, \
                                         project_id = ?8, invoice_id = ?9, updated_at = ?10 \
             WHERE id = ?11",
            params![
                cleaned.title,
                cleaned.note,
                cleaned.start_date,
                cleaned.end_date,
                cleaned.color_key,
                cleaned.color_hex,
                cleaned.client_id,
                cleaned.project_id,
                cleaned.invoice_id,
                now,
                id,
            ],
        )
        .map_err(|e| e.to_string())?;
    if affected == 0 {
        return Err("Événement introuvable.".into());
    }
    drop(conn);
    get_calendar_event(db, id)
}

#[tauri::command]
pub fn delete_calendar_event(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM calendar_events WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
