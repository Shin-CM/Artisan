//! Cache HTTP best-effort pour OpenHolidays API (fériés publics + vacances scolaires).
//! Hors ligne : le frontend s'appuie sur des données embarquées ; ce module ne bloque jamais l'UI.

use chrono::{DateTime, Duration, Utc};
use crate::db::AppDb;
use rusqlite::OptionalExtension;
use serde_json::json;
use tauri::State;

const DEFAULT_BASE: &str = "https://openholidaysapi.org";
const CACHE_TTL_HOURS: i64 = 24;

/// OpenHolidays renvoie **400** si `validFrom`–`validTo` couvre trop d’années civiles
/// (au-delà de ~3 ans). On découpe en tranches inclusives de 3 années max.
fn inclusive_year_chunks(year_from: i32, year_to: i32) -> Vec<(i32, i32)> {
    let mut out = Vec::new();
    let mut y = year_from;
    while y <= year_to {
        let end = std::cmp::min(y + 2, year_to);
        out.push((y, end));
        y = end + 1;
    }
    out
}

fn cache_key(
    country: &str,
    public_sub: Option<&str>,
    school_sub: &str,
    year_from: i32,
    year_to: i32,
    base: &str,
) -> String {
    let pub_part = public_sub.unwrap_or("");
    format!(
        "OH|{base}|{country}|pub:{pub_part}|school:{school_sub}|{year_from}..{year_to}"
    )
}

#[tauri::command]
pub fn get_calendar_holiday_cache(
    db: State<'_, AppDb>,
    cache_key: String,
) -> Result<Option<String>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let row: Option<String> = conn
        .query_row(
            "SELECT json_payload FROM calendar_holiday_cache WHERE cache_key = ?1",
            [&cache_key],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(row)
}

#[tauri::command]
pub async fn sync_open_holidays(
    db: State<'_, AppDb>,
    country_iso: String,
    public_subdivision: Option<String>,
    school_subdivision: String,
    year_from: i32,
    year_to: i32,
    force: bool,
    custom_base_url: Option<String>,
) -> Result<serde_json::Value, String> {
    let base = custom_base_url
        .as_deref()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or(DEFAULT_BASE)
        .trim_end_matches('/')
        .to_string();

    let key = cache_key(
        &country_iso,
        public_subdivision.as_deref(),
        &school_subdivision,
        year_from,
        year_to,
        &base,
    );

    if !force {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        if let Ok(fetched_at) = conn.query_row::<String, _, _>(
            "SELECT fetched_at FROM calendar_holiday_cache WHERE cache_key = ?1",
            [&key],
            |r| r.get(0),
        ) {
            if let Ok(dt) = DateTime::parse_from_rfc3339(&fetched_at) {
                let age = Utc::now().signed_duration_since(dt.with_timezone(&Utc));
                if age < Duration::hours(CACHE_TTL_HOURS) {
                    if let Ok(payload) = conn.query_row::<String, _, _>(
                        "SELECT json_payload FROM calendar_holiday_cache WHERE cache_key = ?1",
                        [&key],
                        |r| r.get(0),
                    ) {
                        let mut v: serde_json::Value =
                            serde_json::from_str(&payload).map_err(|e| e.to_string())?;
                        if let Some(obj) = v.as_object_mut() {
                            obj.insert(
                                "skipped".to_string(),
                                serde_json::Value::Bool(true),
                            );
                        }
                        return Ok(v);
                    }
                }
            }
        }
    }

    let school_country_iso = {
        let sd = school_subdivision.trim();
        if sd.len() >= 3 && sd[..3].eq_ignore_ascii_case("FR-") {
            "FR".to_string()
        } else {
            country_iso.trim().to_string()
        }
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(12))
        .build()
        .map_err(|e| e.to_string())?;

    let mut public_accum: Vec<serde_json::Value> = Vec::new();
    let mut school_accum: Vec<serde_json::Value> = Vec::new();

    for (yf, yt) in inclusive_year_chunks(year_from, year_to) {
        let valid_from = format!("{yf}-01-01");
        let valid_to = format!("{yt}-12-31");

        let mut url_pub = format!(
            "{base}/PublicHolidays?countryIsoCode={country}&validFrom={vf}&validTo={vt}&languageIsoCode=FR",
            base = base,
            country = country_iso,
            vf = valid_from,
            vt = valid_to
        );
        if let Some(ref sd) = public_subdivision {
            let t = sd.trim();
            if !t.is_empty() {
                url_pub.push_str(&format!("&subdivisionCode={t}"));
            }
        }

        let resp_pub = client.get(&url_pub).send().await.map_err(|e| e.to_string())?;
        if !resp_pub.status().is_success() {
            return Err(format!(
                "PublicHolidays HTTP {} ({valid_from}…{valid_to})",
                resp_pub.status().as_u16()
            ));
        }
        let chunk_pub: serde_json::Value = resp_pub.json().await.map_err(|e| e.to_string())?;
        match chunk_pub {
            serde_json::Value::Array(mut a) => public_accum.append(&mut a),
            _ => {
                return Err("PublicHolidays: format de réponse inattendu".to_string());
            }
        }

        let url_school = format!(
            "{base}/SchoolHolidays?countryIsoCode={country}&validFrom={vf}&validTo={vt}&languageIsoCode=FR&subdivisionCode={school}",
            base = base,
            country = school_country_iso,
            vf = valid_from,
            vt = valid_to,
            school = school_subdivision.trim(),
        );

        let resp_school = client
            .get(&url_school)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        if !resp_school.status().is_success() {
            return Err(format!(
                "SchoolHolidays HTTP {} ({valid_from}…{valid_to})",
                resp_school.status().as_u16()
            ));
        }
        let chunk_school: serde_json::Value =
            resp_school.json().await.map_err(|e| e.to_string())?;
        match chunk_school {
            serde_json::Value::Array(mut a) => school_accum.append(&mut a),
            _ => {
                return Err("SchoolHolidays: format de réponse inattendu".to_string());
            }
        }
    }

    let pub_json = serde_json::Value::Array(public_accum);
    let school_json = serde_json::Value::Array(school_accum);

    let fetched = Utc::now().to_rfc3339();
    let bundle = json!({
        "public": pub_json,
        "school": school_json,
        "fetchedAt": fetched,
        "skipped": false,
        "cacheKey": key,
    });

    let payload = bundle.to_string();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        r#"INSERT INTO calendar_holiday_cache (cache_key, json_payload, etag, fetched_at)
           VALUES (?1, ?2, NULL, ?3)
           ON CONFLICT(cache_key) DO UPDATE SET
             json_payload = excluded.json_payload,
             fetched_at = excluded.fetched_at"#,
        rusqlite::params![key, payload, fetched],
    )
    .map_err(|e| e.to_string())?;

    Ok(bundle)
}
