use crate::commands::{
    catalog, clients, quotes, tax_rates,
    types::{ArticleRow, ClientInput, ClientRow, QuoteInput, QuoteRow, TaxRateRow},
};
use crate::local_api::{LocalApiShared, PairingEntry};
use argon2::PasswordVerifier;
use axum::{
    extract::{Path, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rusqlite::OptionalExtension;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    jti: String,
    workspace_id: String,
    exp: i64,
}

#[derive(Serialize)]
struct ErrJson {
    error: String,
}

fn json_err(status: StatusCode, msg: impl Into<String>) -> Response {
    let body = Json(ErrJson { error: msg.into() });
    (status, body).into_response()
}

fn bearer_token(headers: &HeaderMap) -> Option<String> {
    let v = headers.get(header::AUTHORIZATION)?.to_str().ok()?;
    let rest = v
        .strip_prefix("Bearer ")
        .or_else(|| v.strip_prefix("bearer "))?;
    Some(rest.trim().to_string())
}

fn verify_jwt_and_session(state: &LocalApiShared, token: &str) -> Result<Claims, Response> {
    let key = DecodingKey::from_secret(state.jwt_secret.as_slice());
    let mut val = Validation::default();
    val.validate_exp = true;
    let data = decode::<Claims>(token, &key, &val).map_err(|e| {
        json_err(
            StatusCode::UNAUTHORIZED,
            format!("Jeton invalide ou expiré ({})", e),
        )
    })?;
    let claims = data.claims;
    let conn = state
        .db
        .conn
        .lock()
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let ok = conn
        .query_row(
            "SELECT 1 FROM local_api_sessions WHERE jti = ?1 AND revoked_at IS NULL",
            [&claims.jti],
            |_| Ok(1),
        )
        .optional()
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    if ok.is_none() {
        return Err(json_err(
            StatusCode::UNAUTHORIZED,
            "Session révoquée ou inconnue.",
        ));
    }
    Ok(claims)
}

async fn health() -> impl IntoResponse {
    Json(serde_json::json!({ "ok": true, "service": "invoicies-local-api" }))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PairBody {
    pairing_token: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PairOk {
    access_token: String,
    token_type: &'static str,
    expires_in: i64,
    workspace_id: String,
}

async fn auth_pair(
    State(state): State<Arc<LocalApiShared>>,
    Json(body): Json<PairBody>,
) -> Response {
    let entry: PairingEntry = {
        let mut m = match state.pairing.lock() {
            Ok(g) => g,
            Err(_) => return json_err(StatusCode::INTERNAL_SERVER_ERROR, "verrou pairing"),
        };
        match m.remove(&body.pairing_token) {
            Some(e) => e,
            None => {
                return json_err(
                    StatusCode::UNAUTHORIZED,
                    "Jeton de pairing invalide ou déjà utilisé.",
                )
            }
        }
    };
    if Utc::now().timestamp() > entry.expires_unix {
        return json_err(StatusCode::UNAUTHORIZED, "Jeton de pairing expiré.");
    }
    match issue_session_token(&state, &entry.workspace_id, None) {
        Ok(ok) => (StatusCode::OK, Json(ok)).into_response(),
        Err(e) => e,
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LoginBody {
    username: String,
    password: String,
    workspace_id: String,
}

async fn auth_login(
    State(state): State<Arc<LocalApiShared>>,
    Json(body): Json<LoginBody>,
) -> Response {
    let conn = match state.db.conn.lock() {
        Ok(c) => c,
        Err(e) => return json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    };
    let hash_opt: Option<Option<String>> = conn
        .query_row(
            "SELECT password_hash FROM local_api_operator WHERE id = 1",
            [],
            |r| r.get(0),
        )
        .optional()
        .ok()
        .flatten();
    let Some(Some(hash)) = hash_opt else {
        return json_err(
            StatusCode::FORBIDDEN,
            "Connexion par mot de passe non configurée sur ce poste.",
        );
    };
    if hash.is_empty() {
        return json_err(
            StatusCode::FORBIDDEN,
            "Connexion par mot de passe non configurée sur ce poste.",
        );
    }
    let parsed = match argon2::password_hash::PasswordHash::new(&hash) {
        Ok(p) => p,
        Err(_) => return json_err(StatusCode::INTERNAL_SERVER_ERROR, "hash opérateur invalide"),
    };
    if argon2::Argon2::default()
        .verify_password(body.password.as_bytes(), &parsed)
        .is_err()
    {
        return json_err(StatusCode::UNAUTHORIZED, "Identifiants incorrects.");
    }
    let _ignore_username = body.username;
    drop(conn);
    match issue_session_token(&state, &body.workspace_id, Some("password")) {
        Ok(ok) => (StatusCode::OK, Json(ok)).into_response(),
        Err(e) => e,
    }
}

fn issue_session_token(
    state: &LocalApiShared,
    workspace_id: &str,
    label: Option<&str>,
) -> Result<PairOk, Response> {
    let conn = state
        .db
        .conn
        .lock()
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let exists: Option<i64> = conn
        .query_row(
            "SELECT 1 FROM workspaces WHERE id = ?1",
            [workspace_id],
            |_| Ok(1),
        )
        .optional()
        .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    if exists.is_none() {
        return Err(json_err(
            StatusCode::BAD_REQUEST,
            "Espace de travail inconnu.",
        ));
    }
    let session_id = Uuid::new_v4().to_string();
    let jti = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO local_api_sessions (id, jti, workspace_id, label, created_at, revoked_at) VALUES (?1, ?2, ?3, ?4, ?5, NULL)",
        rusqlite::params![session_id, jti, workspace_id, label, now],
    )
    .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    drop(conn);
    let exp = Utc::now() + Duration::days(30);
    let claims = Claims {
        sub: session_id.clone(),
        jti: jti.clone(),
        workspace_id: workspace_id.to_string(),
        exp: exp.timestamp(),
    };
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_slice()),
    )
    .map_err(|e| json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(PairOk {
        access_token: token,
        token_type: "Bearer",
        expires_in: 30 * 86400,
        workspace_id: workspace_id.to_string(),
    })
}

fn require_auth(state: &LocalApiShared, headers: &HeaderMap) -> Result<Claims, Response> {
    let t = bearer_token(headers).ok_or_else(|| {
        json_err(
            StatusCode::UNAUTHORIZED,
            "En-tête Authorization: Bearer manquant.",
        )
    })?;
    verify_jwt_and_session(state, &t)
}

async fn list_clients(State(state): State<Arc<LocalApiShared>>, headers: HeaderMap) -> Response {
    let claims = match require_auth(&state, &headers) {
        Ok(c) => c,
        Err(e) => return e,
    };
    let conn = match state.db.conn.lock() {
        Ok(c) => c,
        Err(e) => return json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    };
    match clients::list_clients_conn(&conn, &claims.workspace_id) {
        Ok(rows) => Json::<Vec<ClientRow>>(rows).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, e),
    }
}

async fn post_clients(
    State(state): State<Arc<LocalApiShared>>,
    headers: HeaderMap,
    Json(input): Json<ClientInput>,
) -> Response {
    let claims = match require_auth(&state, &headers) {
        Ok(c) => c,
        Err(e) => return e,
    };
    let conn = match state.db.conn.lock() {
        Ok(c) => c,
        Err(e) => return json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    };
    match clients::create_client_conn(&conn, &claims.workspace_id, input) {
        Ok(row) => (StatusCode::CREATED, Json::<ClientRow>(row)).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, e),
    }
}

async fn list_products(State(state): State<Arc<LocalApiShared>>, headers: HeaderMap) -> Response {
    let claims = match require_auth(&state, &headers) {
        Ok(c) => c,
        Err(e) => return e,
    };
    let conn = match state.db.conn.lock() {
        Ok(c) => c,
        Err(e) => return json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    };
    match catalog::list_articles_conn(&conn, &claims.workspace_id) {
        Ok(rows) => Json::<Vec<ArticleRow>>(rows).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, e),
    }
}

async fn list_tax_rates(State(state): State<Arc<LocalApiShared>>, headers: HeaderMap) -> Response {
    let claims = match require_auth(&state, &headers) {
        Ok(c) => c,
        Err(e) => return e,
    };
    let conn = match state.db.conn.lock() {
        Ok(c) => c,
        Err(e) => return json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    };
    match tax_rates::list_tax_rates_conn(&conn, &claims.workspace_id) {
        Ok(rows) => Json::<Vec<TaxRateRow>>(rows).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, e),
    }
}

async fn list_quotes(State(state): State<Arc<LocalApiShared>>, headers: HeaderMap) -> Response {
    let claims = match require_auth(&state, &headers) {
        Ok(c) => c,
        Err(e) => return e,
    };
    let conn = match state.db.conn.lock() {
        Ok(c) => c,
        Err(e) => return json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    };
    match quotes::list_quotes_conn(&conn, &claims.workspace_id) {
        Ok(rows) => Json::<Vec<QuoteRow>>(rows).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, e),
    }
}

async fn get_quote(
    State(state): State<Arc<LocalApiShared>>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Response {
    let claims = match require_auth(&state, &headers) {
        Ok(c) => c,
        Err(e) => return e,
    };
    let conn = match state.db.conn.lock() {
        Ok(c) => c,
        Err(e) => return json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    };
    match quotes::get_quote_conn(&conn, &id) {
        Ok(row) => {
            if row.workspace_id != claims.workspace_id {
                return json_err(StatusCode::NOT_FOUND, "Devis introuvable.");
            }
            Json::<QuoteRow>(row).into_response()
        }
        Err(e) => json_err(StatusCode::NOT_FOUND, e),
    }
}

async fn post_quotes(
    State(state): State<Arc<LocalApiShared>>,
    headers: HeaderMap,
    Json(input): Json<QuoteInput>,
) -> Response {
    let claims = match require_auth(&state, &headers) {
        Ok(c) => c,
        Err(e) => return e,
    };
    let conn = match state.db.conn.lock() {
        Ok(c) => c,
        Err(e) => return json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    };
    match quotes::create_quote_conn(&conn, &claims.workspace_id, input) {
        Ok(row) => (StatusCode::CREATED, Json::<QuoteRow>(row)).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, e),
    }
}

async fn patch_quote(
    State(state): State<Arc<LocalApiShared>>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(input): Json<QuoteInput>,
) -> Response {
    let claims = match require_auth(&state, &headers) {
        Ok(c) => c,
        Err(e) => return e,
    };
    let conn = match state.db.conn.lock() {
        Ok(c) => c,
        Err(e) => return json_err(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    };
    let existing = match quotes::get_quote_conn(&conn, &id) {
        Ok(r) => r,
        Err(e) => return json_err(StatusCode::NOT_FOUND, e),
    };
    if existing.workspace_id != claims.workspace_id {
        return json_err(StatusCode::NOT_FOUND, "Devis introuvable.");
    }
    match quotes::update_quote_conn(&conn, &id, input) {
        Ok(row) => Json::<QuoteRow>(row).into_response(),
        Err(e) => json_err(StatusCode::BAD_REQUEST, e),
    }
}

pub fn build_router(state: Arc<LocalApiShared>) -> Router {
    Router::new()
        .route("/api/v1/health", get(health))
        .route("/api/v1/auth/pair", post(auth_pair))
        .route("/api/v1/auth/login", post(auth_login))
        .route("/api/v1/clients", get(list_clients).post(post_clients))
        .route("/api/v1/products", get(list_products))
        .route("/api/v1/tax-rates", get(list_tax_rates))
        .route("/api/v1/quotes", get(list_quotes).post(post_quotes))
        .route("/api/v1/quotes/{id}", get(get_quote).patch(patch_quote))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

pub async fn server_loop(
    shared: Arc<LocalApiShared>,
    mut rx: tokio::sync::watch::Receiver<(bool, u16)>,
) {
    use std::net::Ipv4Addr;
    use tokio::net::TcpListener;
    loop {
        let (enabled, port) = *rx.borrow();
        if !enabled {
            if rx.changed().await.is_err() {
                return;
            }
            continue;
        }
        let listener = match TcpListener::bind((Ipv4Addr::UNSPECIFIED, port)).await {
            Ok(l) => l,
            Err(e) => {
                eprintln!("[local_api] impossible d’écouter le port {} : {}", port, e);
                tokio::select! {
                    _ = tokio::time::sleep(std::time::Duration::from_secs(4)) => {},
                    _ = rx.changed() => {},
                }
                continue;
            }
        };
        let snapshot = (enabled, port);
        let shutdown = {
            let mut rx_c = rx.clone();
            async move {
                loop {
                    if rx_c.changed().await.is_err() {
                        return;
                    }
                    if *rx_c.borrow() != snapshot {
                        return;
                    }
                }
            }
        };
        let app = build_router(shared.clone());
        let _ = axum::serve(listener, app)
            .with_graceful_shutdown(shutdown)
            .await;
    }
}
