use crate::db::AppDb;
use chrono::Utc;
use rusqlite::{params, Connection};
use uuid::Uuid;

use super::types::{ArticleInput, ArticleReorderItem, ArticleRow, CategoryRow};

#[tauri::command]
pub fn list_categories(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<CategoryRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, workspace_id, parent_id, name, sort_order FROM article_categories WHERE workspace_id = ?1 ORDER BY sort_order, name")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([&workspace_id], |row| {
            Ok(CategoryRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                parent_id: row.get(2)?,
                name: row.get(3)?,
                sort_order: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_category(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    name: String,
    parent_id: Option<String>,
) -> Result<CategoryRow, String> {
    let id = Uuid::new_v4().to_string();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO article_categories (id, workspace_id, parent_id, name, sort_order) VALUES (?1,?2,?3,?4,0)",
        params![id, workspace_id, parent_id, name],
    )
    .map_err(|e| e.to_string())?;
    Ok(CategoryRow {
        id,
        workspace_id,
        parent_id,
        name,
        sort_order: 0,
    })
}

#[tauri::command]
pub fn update_category(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    id: String,
    name: String,
) -> Result<CategoryRow, String> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err("Indiquez un nom de catégorie.".to_string());
    }
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let n = conn
        .execute(
            "UPDATE article_categories SET name = ?1 WHERE id = ?2 AND workspace_id = ?3",
            params![name, id, workspace_id],
        )
        .map_err(|e| e.to_string())?;
    if n != 1 {
        return Err("Catégorie introuvable.".to_string());
    }
    conn.query_row(
        "SELECT id, workspace_id, parent_id, name, sort_order FROM article_categories WHERE id = ?1 AND workspace_id = ?2",
        params![id, workspace_id],
        |row| {
            Ok(CategoryRow {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                parent_id: row.get(2)?,
                name: row.get(3)?,
                sort_order: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

/// Articles directs → sans catégorie ; sous-catégories → même parent qu’avant, avec `sort_order` réassignés après les frères existants.
#[tauri::command]
pub fn delete_category(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    id: String,
) -> Result<(), String> {
    let mut conn = db.conn.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let parent_id: Option<String> = tx
        .query_row(
            "SELECT parent_id FROM article_categories WHERE id = ?1 AND workspace_id = ?2",
            params![id, workspace_id],
            |row| row.get(0),
        )
        .map_err(|_| "Catégorie introuvable.".to_string())?;

    let mut stmt = tx
        .prepare(
            "SELECT id FROM article_categories WHERE parent_id = ?1 AND workspace_id = ?2 ORDER BY sort_order, name",
        )
        .map_err(|e| e.to_string())?;
    let child_ids: Vec<String> = stmt
        .query_map(params![id, workspace_id], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    drop(stmt);

    let base_order: i64 = match &parent_id {
        Some(pid) => tx
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) FROM article_categories WHERE workspace_id = ?1 AND parent_id = ?2",
                params![workspace_id, pid],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?,
        None => tx
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) FROM article_categories WHERE workspace_id = ?1 AND parent_id IS NULL",
                [&workspace_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?,
    };

    let now = Utc::now().to_rfc3339();
    let new_parent = parent_id.clone();
    let mut next = base_order + 1;
    for cid in child_ids {
        tx.execute(
            "UPDATE article_categories SET parent_id = ?1, sort_order = ?2 WHERE id = ?3 AND workspace_id = ?4",
            params![&new_parent, next, cid, workspace_id],
        )
        .map_err(|e| e.to_string())?;
        next += 1;
    }

    tx.execute(
        "UPDATE articles SET category_id = NULL, updated_at = ?1 WHERE category_id = ?2 AND workspace_id = ?3",
        params![now, id, workspace_id],
    )
    .map_err(|e| e.to_string())?;

    let n = tx
        .execute(
            "DELETE FROM article_categories WHERE id = ?1 AND workspace_id = ?2",
            params![id, workspace_id],
        )
        .map_err(|e| e.to_string())?;
    if n != 1 {
        return Err("Catégorie introuvable.".to_string());
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

fn next_article_sort_order(
    conn: &rusqlite::Connection,
    workspace_id: &str,
    category_id: &Option<String>,
) -> Result<i64, String> {
    match category_id {
        Some(cid) => conn
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM articles WHERE workspace_id = ?1 AND category_id = ?2",
                params![workspace_id, cid],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string()),
        None => conn
            .query_row(
                "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM articles WHERE workspace_id = ?1 AND category_id IS NULL",
                [workspace_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string()),
    }
}

fn article_row_from_sql(row: &rusqlite::Row<'_>) -> rusqlite::Result<ArticleRow> {
    Ok(ArticleRow {
        id: row.get(0)?,
        workspace_id: row.get(1)?,
        category_id: row.get(2)?,
        name: row.get(3)?,
        description: row.get(4)?,
        base_price: row.get(5)?,
        production_cost: row.get(6)?,
        options_json: row.get(7)?,
        sort_order: row.get(8)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
        flat_price: row.get(11)?,
        hourly_rate: row.get(12)?,
        supplier_name: row.get(13)?,
        supplier_reference: row.get(14)?,
    })
}

fn trim_opt(s: &Option<String>) -> Option<String> {
    s.as_ref()
        .map(|t| t.trim().to_string())
        .filter(|t| !t.is_empty())
}

pub(crate) fn list_articles_conn(
    conn: &Connection,
    workspace_id: &str,
) -> Result<Vec<ArticleRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, category_id, name, description, base_price, production_cost, options_json, sort_order, created_at, updated_at, flat_price, hourly_rate, supplier_name, supplier_reference FROM articles WHERE workspace_id = ?1 ORDER BY (category_id IS NULL), category_id, sort_order, name",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([workspace_id], article_row_from_sql)
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_articles(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<ArticleRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    list_articles_conn(&conn, &workspace_id)
}

#[tauri::command]
pub fn create_article(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: ArticleInput,
) -> Result<ArticleRow, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let opts = serde_json::to_string(&input.options_json).map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let sort_order = next_article_sort_order(&conn, &workspace_id, &input.category_id)?;
    let supplier_name = trim_opt(&input.supplier_name);
    let supplier_reference = trim_opt(&input.supplier_reference);
    conn.execute(
        "INSERT INTO articles (id, workspace_id, category_id, name, description, base_price, production_cost, options_json, sort_order, created_at, updated_at, flat_price, hourly_rate, supplier_name, supplier_reference) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)",
        params![
            id,
            workspace_id,
            input.category_id,
            input.name,
            input.description,
            input.base_price,
            input.production_cost,
            opts,
            sort_order,
            now,
            now,
            input.flat_price,
            input.hourly_rate,
            supplier_name,
            supplier_reference
        ],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    get_article(db, id)
}

#[tauri::command]
pub fn get_article(db: tauri::State<'_, AppDb>, id: String) -> Result<ArticleRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, workspace_id, category_id, name, description, base_price, production_cost, options_json, sort_order, created_at, updated_at, flat_price, hourly_rate, supplier_name, supplier_reference FROM articles WHERE id = ?1",
        [&id],
        article_row_from_sql,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_article(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: ArticleInput,
) -> Result<ArticleRow, String> {
    let now = Utc::now().to_rfc3339();
    let opts = serde_json::to_string(&input.options_json).map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let prev_sort: i64 = conn
        .query_row(
            "SELECT sort_order FROM articles WHERE id = ?1",
            [&id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let sort_order = input.sort_order.unwrap_or(prev_sort);
    let supplier_name = trim_opt(&input.supplier_name);
    let supplier_reference = trim_opt(&input.supplier_reference);
    conn.execute(
        "UPDATE articles SET category_id=?1, name=?2, description=?3, base_price=?4, production_cost=?5, options_json=?6, sort_order=?7, updated_at=?8, flat_price=?9, hourly_rate=?10, supplier_name=?11, supplier_reference=?12 WHERE id=?13",
        params![
            input.category_id,
            input.name,
            input.description,
            input.base_price,
            input.production_cost,
            opts,
            sort_order,
            now,
            input.flat_price,
            input.hourly_rate,
            supplier_name,
            supplier_reference,
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    drop(conn);
    get_article(db, id)
}

#[tauri::command]
pub fn delete_article(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM articles WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reorder_articles(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    items: Vec<ArticleReorderItem>,
) -> Result<(), String> {
    let mut conn = db.conn.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    for it in &items {
        let n = tx
            .execute(
                "UPDATE articles SET category_id = ?1, sort_order = ?2, updated_at = ?3 WHERE id = ?4 AND workspace_id = ?5",
                params![
                    it.category_id,
                    it.sort_order,
                    now,
                    it.id,
                    workspace_id
                ],
            )
            .map_err(|e| e.to_string())?;
        if n != 1 {
            return Err(format!("Article introuvable : {}", it.id));
        }
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reorder_categories(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    parent_id: Option<String>,
    ordered_ids: Vec<String>,
) -> Result<(), String> {
    let mut conn = db.conn.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    for (i, id) in ordered_ids.iter().enumerate() {
        let n = tx
            .execute(
                "UPDATE article_categories SET sort_order = ?1 WHERE id = ?2 AND workspace_id = ?3 AND ((?4 IS NULL AND parent_id IS NULL) OR parent_id = ?4)",
                params![i as i64, id, workspace_id, parent_id],
            )
            .map_err(|e| e.to_string())?;
        if n != 1 {
            return Err(format!(
                "Catégorie introuvable ou parent incorrect : {}",
                id
            ));
        }
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
