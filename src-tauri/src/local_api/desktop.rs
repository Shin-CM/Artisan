use super::{
    read_api_settings, write_api_settings, LocalApiControl, PairingEntry, QrPairingPayload,
};
use crate::db::AppDb;
use argon2::password_hash::{PasswordHasher, SaltString};
use argon2::Argon2;
use chrono::Utc;
use rand::rngs::OsRng;
use rand::RngCore;
use rusqlite::OptionalExtension;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalApiStatus {
    pub enabled: bool,
    pub port: u16,
    pub suggested_lan_ip: String,
    pub api_base_url: String,
    pub operator_password_set: bool,
}

#[tauri::command]
pub fn local_api_get_status(control: State<'_, LocalApiControl>) -> Result<LocalApiStatus, String> {
    let (enabled, port) = read_api_settings(&control.shared.db)?;
    let suggested_lan_ip = local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .unwrap_or_else(|_| "127.0.0.1".to_string());
    let api_base_url = format!("http://{}:{}", suggested_lan_ip, port);
    let conn = control.shared.db.conn.lock().map_err(|e| e.to_string())?;
    let ph: Option<Option<String>> = conn
        .query_row(
            "SELECT password_hash FROM local_api_operator WHERE id = 1",
            [],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    let operator_password_set = ph.flatten().map(|s| !s.trim().is_empty()).unwrap_or(false);
    Ok(LocalApiStatus {
        enabled,
        port,
        suggested_lan_ip,
        api_base_url,
        operator_password_set,
    })
}

#[tauri::command]
pub fn local_api_set_enabled(
    control: State<'_, LocalApiControl>,
    enabled: bool,
) -> Result<(), String> {
    let (_, port) = read_api_settings(&control.shared.db)?;
    write_api_settings(&control.shared.db, enabled, port)?;
    control
        .watch
        .send((enabled, port))
        .map_err(|_| "aucun abonné au service API".to_string())?;
    Ok(())
}

#[tauri::command]
pub fn local_api_set_port(control: State<'_, LocalApiControl>, port: u16) -> Result<(), String> {
    if port == 0 {
        return Err("Port invalide.".to_string());
    }
    let (enabled, _) = read_api_settings(&control.shared.db)?;
    write_api_settings(&control.shared.db, enabled, port)?;
    control
        .watch
        .send((enabled, port))
        .map_err(|_| "aucun abonné au service API".to_string())?;
    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartPairingPayload {
    pub workspace_id: String,
}

#[tauri::command]
pub fn local_api_start_pairing(
    control: State<'_, LocalApiControl>,
    payload: StartPairingPayload,
) -> Result<QrPairingPayload, String> {
    let workspace_id = payload.workspace_id;
    let (_, port) = read_api_settings(&control.shared.db)?;
    let suggested_lan_ip = local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .unwrap_or_else(|_| "127.0.0.1".to_string());
    let api_url = format!("http://{}:{}", suggested_lan_ip, port);
    let mut raw = [0u8; 32];
    OsRng.fill_bytes(&mut raw);
    let pairing_token = hex_lower(&raw);
    let expires_unix = Utc::now().timestamp() + 300;
    {
        let mut m = control.shared.pairing.lock().map_err(|e| e.to_string())?;
        m.insert(
            pairing_token.clone(),
            PairingEntry {
                workspace_id: workspace_id.clone(),
                expires_unix,
            },
        );
    }
    Ok(QrPairingPayload {
        api_url,
        pairing_token,
        expires_in: 300,
    })
}

fn hex_lower(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push(HEX[(b >> 4) as usize] as char);
        s.push(HEX[(b & 0xf) as usize] as char);
    }
    s
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalApiSessionRow {
    pub id: String,
    pub workspace_id: String,
    pub label: Option<String>,
    pub created_at: String,
    pub revoked_at: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListSessionsPayload {
    pub workspace_id: Option<String>,
}

#[tauri::command]
pub fn local_api_list_sessions(
    db: State<'_, AppDb>,
    payload: ListSessionsPayload,
) -> Result<Vec<LocalApiSessionRow>, String> {
    let workspace_id = payload.workspace_id;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    if let Some(ws) = workspace_id {
        let mut stmt = conn
            .prepare(
                "SELECT id, workspace_id, label, created_at, revoked_at FROM local_api_sessions WHERE workspace_id = ?1 ORDER BY created_at DESC",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([&ws], |r| {
                Ok(LocalApiSessionRow {
                    id: r.get(0)?,
                    workspace_id: r.get(1)?,
                    label: r.get(2)?,
                    created_at: r.get(3)?,
                    revoked_at: r.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            out.push(row.map_err(|e| e.to_string())?);
        }
    } else {
        let mut stmt = conn
            .prepare(
                "SELECT id, workspace_id, label, created_at, revoked_at FROM local_api_sessions ORDER BY created_at DESC LIMIT 200",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |r| {
                Ok(LocalApiSessionRow {
                    id: r.get(0)?,
                    workspace_id: r.get(1)?,
                    label: r.get(2)?,
                    created_at: r.get(3)?,
                    revoked_at: r.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            out.push(row.map_err(|e| e.to_string())?);
        }
    }
    Ok(out)
}

#[tauri::command]
pub fn local_api_revoke_session(db: State<'_, AppDb>, session_id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();
    let n = conn
        .execute(
            "UPDATE local_api_sessions SET revoked_at = ?1 WHERE id = ?2 AND revoked_at IS NULL",
            rusqlite::params![now, session_id],
        )
        .map_err(|e| e.to_string())?;
    if n != 1 {
        return Err("Session introuvable ou déjà révoquée.".to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn local_api_set_operator_password(
    db: State<'_, AppDb>,
    password: String,
) -> Result<(), String> {
    if password.len() < 8 {
        return Err("Le mot de passe doit contenir au moins 8 caractères.".to_string());
    }
    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?
        .to_string();
    let now = Utc::now().to_rfc3339();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE local_api_operator SET password_hash = ?1, updated_at = ?2 WHERE id = 1",
        rusqlite::params![hash, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
