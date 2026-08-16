mod desktop;
mod server;

pub use desktop::*;

use crate::db::AppDb;
use chrono::Utc;
use rand::rngs::OsRng;
use rand::RngCore;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, Mutex};
use tokio::sync::watch;

#[derive(Clone)]
pub struct LocalApiShared {
    pub db: AppDb,
    pub pairing: Arc<Mutex<HashMap<String, PairingEntry>>>,
    pub jwt_secret: Arc<Vec<u8>>,
}

#[derive(Clone)]
pub struct PairingEntry {
    pub workspace_id: String,
    pub expires_unix: i64,
}

pub struct LocalApiControl {
    pub shared: Arc<LocalApiShared>,
    pub watch: watch::Sender<(bool, u16)>,
}

pub fn read_api_settings(db: &AppDb) -> Result<(bool, u16), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT api_enabled, api_port FROM local_api_settings WHERE id = 1",
        [],
        |r| Ok((r.get::<_, i64>(0)? != 0, r.get::<_, i64>(1)? as u16)),
    )
    .map_err(|e| e.to_string())
}

pub fn write_api_settings(db: &AppDb, enabled: bool, port: u16) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE local_api_settings SET api_enabled = ?1, api_port = ?2, updated_at = ?3 WHERE id = 1",
        params![if enabled { 1 } else { 0 }, port as i64, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_or_create_jwt_secret(path: &Path) -> Result<Vec<u8>, String> {
    if path.exists() {
        return std::fs::read(path).map_err(|e| e.to_string());
    }
    let mut secret = vec![0u8; 48];
    OsRng.fill_bytes(&mut secret);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(path, &secret).map_err(|e| e.to_string())?;
    Ok(secret)
}

pub fn spawn_server_loop(shared: Arc<LocalApiShared>, rx: watch::Receiver<(bool, u16)>) {
    tauri::async_runtime::spawn(server::server_loop(shared, rx));
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QrPairingPayload {
    pub api_url: String,
    pub pairing_token: String,
    pub expires_in: i64,
}
