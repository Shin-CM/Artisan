use rusqlite::Connection;

pub fn migrate(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS calendar_holiday_cache (
            cache_key TEXT PRIMARY KEY,
            json_payload TEXT NOT NULL,
            etag TEXT,
            fetched_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_calendar_holiday_cache_fetched
            ON calendar_holiday_cache(fetched_at);
        "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
