use crate::db::AppDb;
use chrono::Utc;
use rusqlite::{params, Connection};
use uuid::Uuid;

use super::types::{
    StockArticleSettingInput, StockArticleSettingRow, StockLevelRow, StockLowAlertRow,
    StockMovementInput, StockMovementRow,
};

fn normalize_kind(raw: &str) -> Result<&'static str, String> {
    match raw.trim() {
        "in" => Ok("in"),
        "out" => Ok("out"),
        "adjustment" => Ok("adjustment"),
        t => Err(format!("Type de mouvement invalide : {t}")),
    }
}

fn current_level(conn: &Connection, workspace_id: &str, article_id: &str) -> Result<f64, String> {
    let q: Option<f64> = conn
        .query_row(
            "SELECT quantity FROM stock_levels WHERE workspace_id = ?1 AND article_id = ?2",
            params![workspace_id, article_id],
            |r| r.get(0),
        )
        .ok();
    Ok(q.unwrap_or(0.0))
}

fn ensure_article_in_workspace(
    conn: &Connection,
    workspace_id: &str,
    article_id: &str,
) -> Result<String, String> {
    conn.query_row(
        "SELECT name FROM articles WHERE id = ?1 AND workspace_id = ?2",
        params![article_id, workspace_id],
        |r| r.get(0),
    )
    .map_err(|_| "Article introuvable dans cet espace.".to_string())
}

#[tauri::command]
pub fn list_stock_levels(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<StockLevelRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT a.id, a.name, COALESCE(s.quantity, 0), COALESCE(s.updated_at, '') \
             FROM articles a \
             LEFT JOIN stock_levels s ON s.article_id = a.id AND s.workspace_id = a.workspace_id \
             WHERE a.workspace_id = ?1 \
             ORDER BY a.name ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |r| {
            let qty: f64 = r.get(2)?;
            let updated: String = r.get(3)?;
            Ok(StockLevelRow {
                article_id: r.get(0)?,
                article_name: r.get(1)?,
                quantity: qty,
                updated_at: if updated.is_empty() {
                    "—".into()
                } else {
                    updated
                },
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_stock_movements(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<StockMovementRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT m.id, m.article_id, a.name, m.movement_kind, m.quantity_delta, m.label, m.created_at \
             FROM stock_movements m \
             JOIN articles a ON a.id = m.article_id \
             WHERE m.workspace_id = ?1 \
             ORDER BY m.created_at DESC \
             LIMIT 300",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |r| {
            Ok(StockMovementRow {
                id: r.get(0)?,
                article_id: r.get(1)?,
                article_name: r.get(2)?,
                movement_kind: r.get(3)?,
                quantity_delta: r.get(4)?,
                label: r.get(5)?,
                created_at: r.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_stock_movement(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: StockMovementInput,
) -> Result<StockMovementRow, String> {
    let article_id = input.article_id.clone();
    let kind = normalize_kind(&input.movement_kind)?;
    let q = input.quantity;
    if !q.is_finite() {
        return Err("Quantité invalide.".into());
    }
    let delta = match kind {
        "in" => {
            if q <= 0.0 {
                return Err("Pour une entrée, la quantité doit être positive.".into());
            }
            q
        }
        "out" => {
            if q <= 0.0 {
                return Err("Pour une sortie, la quantité doit être positive.".into());
            }
            -q
        }
        "adjustment" => q,
        _ => unreachable!(),
    };
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let _name = ensure_article_in_workspace(&conn, &workspace_id, &article_id)?;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    let before = current_level(&tx, &workspace_id, &article_id)?;
    let after = before + delta;
    if after < -1e-9 {
        return Err("Stock insuffisant pour ce mouvement.".into());
    }
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    tx.execute(
        "INSERT INTO stock_movements (id, workspace_id, article_id, movement_kind, quantity_delta, label, created_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7)",
        params![
            id,
            workspace_id,
            article_id,
            kind,
            delta,
            input.label,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO stock_levels (workspace_id, article_id, quantity, updated_at) VALUES (?1,?2,?3,?4) \
         ON CONFLICT(workspace_id, article_id) DO UPDATE SET quantity = excluded.quantity, updated_at = excluded.updated_at",
        params![workspace_id, article_id, after, now],
    )
    .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    let article_name = ensure_article_in_workspace(&conn, &workspace_id, &article_id)?;
    Ok(StockMovementRow {
        id,
        article_id,
        article_name,
        movement_kind: kind.to_string(),
        quantity_delta: delta,
        label: input.label,
        created_at: now,
    })
}

#[tauri::command]
pub fn list_stock_article_settings(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<StockArticleSettingRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT s.article_id, a.name, s.track_stock, s.min_quantity, s.reorder_quantity \
             FROM stock_article_settings s \
             JOIN articles a ON a.id = s.article_id AND a.workspace_id = s.workspace_id \
             WHERE s.workspace_id = ?1 \
             ORDER BY a.name ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |r| {
            let track: i64 = r.get(2)?;
            Ok(StockArticleSettingRow {
                article_id: r.get(0)?,
                article_name: r.get(1)?,
                track_stock: track != 0,
                min_quantity: r.get(3)?,
                reorder_quantity: r.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn upsert_stock_article_setting(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: StockArticleSettingInput,
) -> Result<StockArticleSettingRow, String> {
    let article_id = input.article_id.clone();
    if input.track_stock {
        if let Some(min) = input.min_quantity {
            if !min.is_finite() || min < 0.0 {
                return Err("Le seuil minimum doit être un nombre positif ou nul.".into());
            }
        }
        if let Some(reorder) = input.reorder_quantity {
            if !reorder.is_finite() || reorder < 0.0 {
                return Err("La quantité de réapprovisionnement doit être positive ou nulle.".into());
            }
        }
    }
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let article_name = ensure_article_in_workspace(&conn, &workspace_id, &article_id)?;
    let now = Utc::now().to_rfc3339();
    let track = if input.track_stock { 1 } else { 0 };
    let min_q = if input.track_stock {
        input.min_quantity
    } else {
        None
    };
    let reorder_q = if input.track_stock {
        input.reorder_quantity
    } else {
        None
    };
    conn.execute(
        "INSERT INTO stock_article_settings (workspace_id, article_id, track_stock, min_quantity, reorder_quantity, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6) \
         ON CONFLICT(workspace_id, article_id) DO UPDATE SET \
           track_stock = excluded.track_stock, \
           min_quantity = excluded.min_quantity, \
           reorder_quantity = excluded.reorder_quantity, \
           updated_at = excluded.updated_at",
        params![
            workspace_id,
            article_id,
            track,
            min_q,
            reorder_q,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(StockArticleSettingRow {
        article_id,
        article_name,
        track_stock: input.track_stock,
        min_quantity: min_q,
        reorder_quantity: reorder_q,
    })
}

/// Articles suivis dont la quantité est strictement sous le seuil minimum.
#[tauri::command]
pub fn list_stock_low_alerts(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<StockLowAlertRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT s.article_id, a.name, COALESCE(l.quantity, 0), s.min_quantity \
             FROM stock_article_settings s \
             JOIN articles a ON a.id = s.article_id AND a.workspace_id = s.workspace_id \
             LEFT JOIN stock_levels l ON l.article_id = s.article_id AND l.workspace_id = s.workspace_id \
             WHERE s.workspace_id = ?1 AND s.track_stock = 1 AND s.min_quantity IS NOT NULL \
               AND COALESCE(l.quantity, 0) < s.min_quantity \
             ORDER BY a.name ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |r| {
            Ok(StockLowAlertRow {
                article_id: r.get(0)?,
                article_name: r.get(1)?,
                quantity: r.get(2)?,
                min_quantity: r.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

/// Supprime niveau et historique de mouvements pour un article (le catalogue `articles` est inchangé).
#[tauri::command]
pub fn clear_article_stock(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    article_id: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let _ = ensure_article_in_workspace(&conn, &workspace_id, &article_id)?;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "DELETE FROM stock_movements WHERE workspace_id = ?1 AND article_id = ?2",
        params![workspace_id, article_id],
    )
    .map_err(|e| e.to_string())?;
    tx.execute(
        "DELETE FROM stock_levels WHERE workspace_id = ?1 AND article_id = ?2",
        params![workspace_id, article_id],
    )
    .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
