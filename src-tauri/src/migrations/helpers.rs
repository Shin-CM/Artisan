use rusqlite::Connection;

pub(crate) fn column_exists(conn: &Connection, table: &str, name: &str) -> Result<bool, String> {
    let pragma = format!("PRAGMA table_info({})", table);
    let mut stmt = conn.prepare(&pragma).map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let col_name: String = row.get(1).map_err(|e| e.to_string())?;
        if col_name == name {
            return Ok(true);
        }
    }
    Ok(false)
}
