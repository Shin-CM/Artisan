use crate::db::AppDb;
use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use super::types::{TextSnippetInput, TextSnippetRow};

#[tauri::command]
pub fn list_text_snippets(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<TextSnippetRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, workspace_id, name, body, created_at FROM text_snippets WHERE workspace_id = ?1 ORDER BY name")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |row| {
            Ok(TextSnippetRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                body: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_text_snippet(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: TextSnippetInput,
) -> Result<TextSnippetRow, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let name = input.name.trim().to_string();
    if name.is_empty() {
        return Err("Le nom du texte est obligatoire.".into());
    }
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO text_snippets (id, workspace_id, name, body, created_at) VALUES (?1,?2,?3,?4,?5)",
        params![id, workspace_id, name, input.body, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(TextSnippetRow {
        id,
        workspace_id,
        name,
        body: input.body,
        created_at: now,
    })
}

#[tauri::command]
pub fn update_text_snippet(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: TextSnippetInput,
) -> Result<TextSnippetRow, String> {
    let name = input.name.trim().to_string();
    if name.is_empty() {
        return Err("Le nom du texte est obligatoire.".into());
    }
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE text_snippets SET name=?1, body=?2 WHERE id=?3",
        params![name, input.body, id],
    )
    .map_err(|e| e.to_string())?;
    let row = conn
        .query_row(
            "SELECT id, workspace_id, name, body, created_at FROM text_snippets WHERE id = ?1",
            [&id],
            |row| {
                Ok(TextSnippetRow {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    name: row.get(2)?,
                    body: row.get(3)?,
                    created_at: row.get(4)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub fn delete_text_snippet(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM text_snippets WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
