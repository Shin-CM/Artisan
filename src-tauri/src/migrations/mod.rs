//! Migrations SQLite extraites pour alléger `db.rs`.
pub mod calendar;
pub mod client_followup;
pub mod holiday_cache;
pub mod recovery;

mod helpers;
mod incremental;

/// ALTER TABLE et tables dérivées, dans l’ordre historique requis.
pub fn run_incremental_migrations(conn: &rusqlite::Connection) -> Result<(), String> {
    incremental::run(conn)
}
