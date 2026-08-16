use crate::db::{next_document_number, peek_next_document_number, AppDb};
use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use super::document_discount::{
    apply_document_discount, apply_line_discount_ht, line_discount_triple_for_db,
    line_discount_tuple_for_apply, normalize_discount_kind,
};
use super::projects::ensure_project_belongs_to_workspace;
use super::types::{
    QuoteComplementInput, QuoteComplementRow, QuoteInput, QuoteLineInput, QuoteLineRow, QuoteRow,
};

fn quote_discount_for_apply(input: &QuoteInput) -> (&'static str, f64) {
    let kind = normalize_discount_kind(input.discount_kind.as_deref());
    let val_raw = input.discount_value.unwrap_or(0.0);
    let val = if val_raw.is_finite() {
        val_raw.max(0.0)
    } else {
        0.0
    };
    if kind == "none" || val <= 0.0 {
        ("none", 0.0)
    } else {
        (kind, val)
    }
}

fn quote_discount_label_stored(input: &QuoteInput, kind: &str) -> Option<String> {
    if kind == "none" {
        return None;
    }
    input
        .discount_label
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

fn recalc_quote_totals(
    lines: &[QuoteLineInput],
    tax_exempt: bool,
) -> (Vec<(f64, f64, f64)>, f64, f64, f64) {
    let mut details = Vec::new();
    let mut subtotal = 0f64;
    let mut tax_total = 0f64;
    for line in lines {
        let gross = line.quantity * line.unit_price;
        let (lk, lv) = line_discount_tuple_for_apply(
            line.line_discount_kind.as_deref(),
            line.line_discount_value,
        );
        let line_sub = apply_line_discount_ht(gross, lk, lv);
        let line_tax = if tax_exempt {
            0f64
        } else {
            line_sub * (line.tax_rate / 100.0)
        };
        let line_tot = line_sub + line_tax;
        subtotal += line_sub;
        tax_total += line_tax;
        details.push((line_sub, line_tax, line_tot));
    }
    let total = subtotal + tax_total;
    (details, subtotal, tax_total, total)
}

fn quote_line_discount_stored(line: &QuoteLineInput) -> (String, f64, Option<String>) {
    line_discount_triple_for_db(
        line.line_discount_kind.as_deref(),
        line.line_discount_value,
        line.line_discount_label.as_deref(),
    )
}

fn ensure_quote_number_available(
    conn: &rusqlite::Connection,
    workspace_id: &str,
    number: &str,
    exclude_quote_id: Option<&str>,
) -> Result<(), String> {
    let found: Option<String> = if let Some(ex) = exclude_quote_id {
        conn.query_row(
            "SELECT id FROM quotes WHERE workspace_id = ?1 AND number = ?2 AND id != ?3",
            rusqlite::params![workspace_id, number, ex],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
    } else {
        conn.query_row(
            "SELECT id FROM quotes WHERE workspace_id = ?1 AND number = ?2",
            rusqlite::params![workspace_id, number],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
    };
    if found.is_some() {
        return Err(format!(
            "La référence « {} » est déjà utilisée pour un autre devis dans cet espace.",
            number
        ));
    }
    Ok(())
}

pub(crate) fn list_quotes_conn(
    conn: &Connection,
    workspace_id: &str,
) -> Result<Vec<QuoteRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, client_id, number, title, use_custom_number, status, currency, tax_exempt, issue_date, valid_until, subtotal, tax_total, total, discount_kind, discount_value, discount_label, notes, pdf_template_variant, archived, project_id FROM quotes WHERE workspace_id = ?1 ORDER BY issue_date DESC, created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let base: Vec<_> = stmt
        .query_map([workspace_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, i64>(5)? == 1,
                row.get::<_, String>(6)?,
                row.get::<_, String>(7)?,
                row.get::<_, i64>(8)? == 1,
                row.get::<_, String>(9)?,
                row.get::<_, Option<String>>(10)?,
                row.get::<_, f64>(11)?,
                row.get::<_, f64>(12)?,
                row.get::<_, f64>(13)?,
                row.get::<_, String>(14)?,
                row.get::<_, f64>(15)?,
                row.get::<_, Option<String>>(16)?,
                row.get::<_, Option<String>>(17)?,
                row.get::<_, Option<String>>(18)?,
                row.get::<_, i64>(19)? == 1,
                row.get::<_, Option<String>>(20)?,
            ))
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for (
        id,
        ws,
        client_id,
        number,
        title,
        use_custom_number,
        status,
        currency,
        tax_exempt,
        issue_date,
        valid_until,
        subtotal,
        tax_total,
        total,
        discount_kind,
        discount_value,
        discount_label,
        notes,
        pdf_template_variant,
        archived,
        project_id,
    ) in base
    {
        let lines = load_quote_lines(conn, &id)?;
        let complements = load_quote_complements(conn, &id)?;
        out.push(QuoteRow {
            id,
            workspace_id: ws,
            client_id,
            number,
            title,
            use_custom_number,
            status,
            currency,
            tax_exempt,
            issue_date,
            valid_until,
            subtotal,
            tax_total,
            total,
            discount_kind,
            discount_value,
            discount_label,
            notes,
            pdf_template_variant,
            archived,
            project_id,
            lines,
            complements,
        });
    }
    Ok(out)
}

#[tauri::command]
pub fn list_quotes(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<QuoteRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    list_quotes_conn(&conn, &workspace_id)
}

fn normalized_line_billing(raw: &str) -> &'static str {
    match raw.trim() {
        "flat" => "flat",
        "hourly" => "hourly",
        _ => "unit",
    }
}

fn line_note_db(input: &QuoteLineInput) -> Option<String> {
    input
        .line_note
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

fn load_quote_complements(
    conn: &rusqlite::Connection,
    quote_id: &str,
) -> Result<Vec<QuoteComplementRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, quote_id, sort_order, snippet_id, body FROM quote_complements WHERE quote_id = ?1 ORDER BY sort_order",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([quote_id], |row| {
            Ok(QuoteComplementRow {
                id: row.get(0)?,
                quote_id: row.get(1)?,
                sort_order: row.get(2)?,
                snippet_id: row.get(3)?,
                body: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

fn replace_quote_complements(
    conn: &rusqlite::Connection,
    quote_id: &str,
    items: &[QuoteComplementInput],
) -> Result<(), String> {
    conn.execute(
        "DELETE FROM quote_complements WHERE quote_id = ?1",
        [quote_id],
    )
    .map_err(|e| e.to_string())?;
    for (i, c) in items.iter().enumerate() {
        let id = c.id.clone().unwrap_or_else(|| Uuid::new_v4().to_string());
        conn.execute(
            "INSERT INTO quote_complements (id, quote_id, sort_order, snippet_id, body) VALUES (?1,?2,?3,?4,?5)",
            params![id, quote_id, i as i64, c.snippet_id, c.body],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn load_quote_lines(
    conn: &rusqlite::Connection,
    quote_id: &str,
) -> Result<Vec<QuoteLineRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, quote_id, article_id, description, options_snapshot_json, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total, sort_order, line_note, show_note_on_quote, billing_mode, line_discount_kind, line_discount_value, line_discount_label FROM quote_lines WHERE quote_id = ?1 ORDER BY sort_order",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([quote_id], |row| {
            Ok(QuoteLineRow {
                id: row.get(0)?,
                quote_id: row.get(1)?,
                article_id: row.get(2)?,
                description: row.get(3)?,
                options_snapshot_json: row.get(4)?,
                quantity: row.get(5)?,
                unit_price: row.get(6)?,
                tax_rate: row.get(7)?,
                line_subtotal: row.get(8)?,
                line_tax: row.get(9)?,
                line_total: row.get(10)?,
                sort_order: row.get(11)?,
                line_note: row.get(12)?,
                show_note_on_quote: row.get::<_, i64>(13)? == 1,
                billing_mode: row.get::<_, String>(14)?,
                line_discount_kind: row.get::<_, String>(15)?,
                line_discount_value: row.get::<_, f64>(16)?,
                line_discount_label: row.get(17)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn peek_next_quote_number(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<String, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    peek_next_document_number(&conn, &workspace_id, "DEV")
}

pub(crate) fn create_quote_conn(
    conn: &Connection,
    workspace_id: &str,
    input: QuoteInput,
) -> Result<QuoteRow, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let (details, gross_sub, gross_tax, _) = recalc_quote_totals(&input.lines, input.tax_exempt);
    let (d_kind, d_val) = quote_discount_for_apply(&input);
    let (subtotal, tax_total, total) =
        apply_document_discount(gross_sub, gross_tax, input.tax_exempt, d_kind, d_val);
    let d_label = quote_discount_label_stored(&input, d_kind);
    ensure_project_belongs_to_workspace(conn, workspace_id, input.project_id.as_deref())?;
    let title = input.title.as_deref().unwrap_or("").trim().to_string();
    let use_c = input.use_custom_number;
    let (number, use_custom_number): (String, i64) = if use_c {
        let s = input
            .custom_number
            .as_deref()
            .map(str::trim)
            .filter(|x| !x.is_empty())
            .ok_or_else(|| "Indiquez une référence de devis.".to_string())?;
        ensure_quote_number_available(conn, workspace_id, s, None)?;
        (s.to_string(), 1)
    } else {
        (next_document_number(conn, workspace_id, "DEV")?, 0)
    };
    let pdf_v = input.pdf_template_variant.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() {
            None
        } else {
            Some(s.clone())
        }
    });
    conn.execute(
        "INSERT INTO quotes (id, workspace_id, client_id, number, title, use_custom_number, status, currency, tax_exempt, issue_date, valid_until, subtotal, tax_total, total, notes, pdf_template_variant, archived, discount_kind, discount_value, discount_label, project_id, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23)",
        params![
            id,
            workspace_id,
            input.client_id,
            number,
            title,
            use_custom_number,
            input.status,
            input.currency,
            if input.tax_exempt { 1 } else { 0 },
            input.issue_date,
            input.valid_until,
            subtotal,
            tax_total,
            total,
            input.notes,
            pdf_v,
            if input.archived { 1 } else { 0 },
            d_kind,
            d_val,
            d_label,
            input.project_id,
            now,
            now
        ],
    )
    .map_err(|e| e.to_string())?;

    for (i, line) in input.lines.iter().enumerate() {
        let lid = line
            .id
            .clone()
            .unwrap_or_else(|| Uuid::new_v4().to_string());
        let snap =
            serde_json::to_string(&line.options_snapshot_json).unwrap_or_else(|_| "{}".into());
        let (ls, lt, ltot) = details[i];
        let note = line_note_db(line);
        let (ldk, ldv, ldl) = quote_line_discount_stored(line);
        conn.execute(
            "INSERT INTO quote_lines (id, quote_id, article_id, description, options_snapshot_json, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total, sort_order, line_note, show_note_on_quote, billing_mode, line_discount_kind, line_discount_value, line_discount_label) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)",
            params![
                lid,
                id,
                line.article_id,
                line.description,
                snap,
                line.quantity,
                line.unit_price,
                line.tax_rate,
                ls,
                lt,
                ltot,
                i as i64,
                note,
                if line.show_note_on_quote { 1 } else { 0 },
                normalized_line_billing(&line.billing_mode),
                ldk,
                ldv,
                ldl,
            ],
        )
        .map_err(|e| e.to_string())?;
    }
    replace_quote_complements(conn, &id, &input.complements)?;
    get_quote_conn(conn, &id)
}

#[tauri::command]
pub fn create_quote(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: QuoteInput,
) -> Result<QuoteRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    create_quote_conn(&conn, &workspace_id, input)
}

pub(crate) fn get_quote_conn(conn: &Connection, id: &str) -> Result<QuoteRow, String> {
    let row = conn
        .query_row(
            "SELECT id, workspace_id, client_id, number, title, use_custom_number, status, currency, tax_exempt, issue_date, valid_until, subtotal, tax_total, total, discount_kind, discount_value, discount_label, notes, pdf_template_variant, archived, project_id FROM quotes WHERE id = ?1",
            [id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, i64>(5)? == 1,
                    row.get::<_, String>(6)?,
                    row.get::<_, String>(7)?,
                    row.get::<_, i64>(8)? == 1,
                    row.get::<_, String>(9)?,
                    row.get::<_, Option<String>>(10)?,
                    row.get::<_, f64>(11)?,
                    row.get::<_, f64>(12)?,
                    row.get::<_, f64>(13)?,
                    row.get::<_, String>(14)?,
                    row.get::<_, f64>(15)?,
                    row.get::<_, Option<String>>(16)?,
                    row.get::<_, Option<String>>(17)?,
                    row.get::<_, Option<String>>(18)?,
                    row.get::<_, i64>(19)? == 1,
                    row.get::<_, Option<String>>(20)?,
                ))
            },
        )
        .map_err(|e| e.to_string())?;
    let lines = load_quote_lines(conn, id)?;
    let (
        qid,
        ws,
        client_id,
        number,
        title,
        use_custom_number,
        status,
        currency,
        tax_exempt,
        issue_date,
        valid_until,
        subtotal,
        tax_total,
        total,
        discount_kind,
        discount_value,
        discount_label,
        notes,
        pdf_template_variant,
        archived,
        project_id,
    ) = row;
    let complements = load_quote_complements(conn, &qid)?;
    Ok(QuoteRow {
        id: qid,
        workspace_id: ws,
        client_id,
        number,
        title,
        use_custom_number,
        status,
        currency,
        tax_exempt,
        issue_date,
        valid_until,
        subtotal,
        tax_total,
        total,
        discount_kind,
        discount_value,
        discount_label,
        notes,
        pdf_template_variant,
        archived,
        project_id,
        lines,
        complements,
    })
}

#[tauri::command]
pub fn get_quote(db: tauri::State<'_, AppDb>, id: String) -> Result<QuoteRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    get_quote_conn(&conn, &id)
}

pub(crate) fn update_quote_conn(
    conn: &Connection,
    id: &str,
    input: QuoteInput,
) -> Result<QuoteRow, String> {
    let now = Utc::now().to_rfc3339();
    let (details, gross_sub, gross_tax, _) = recalc_quote_totals(&input.lines, input.tax_exempt);
    let (d_kind, d_val) = quote_discount_for_apply(&input);
    let (subtotal, tax_total, total) =
        apply_document_discount(gross_sub, gross_tax, input.tax_exempt, d_kind, d_val);
    let d_label = quote_discount_label_stored(&input, d_kind);

    let (ws_id, old_number, old_use): (String, String, i64) = conn
        .query_row(
            "SELECT workspace_id, number, use_custom_number FROM quotes WHERE id = ?1",
            [id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .map_err(|e| e.to_string())?;

    ensure_project_belongs_to_workspace(conn, &ws_id, input.project_id.as_deref())?;

    let title = input.title.as_deref().unwrap_or("").trim().to_string();
    let use_c = input.use_custom_number;

    let (new_number, new_use): (String, i64) = if use_c {
        let s = input
            .custom_number
            .as_deref()
            .map(str::trim)
            .filter(|x| !x.is_empty())
            .ok_or_else(|| "Indiquez une référence de devis.".to_string())?;
        if s != old_number.as_str() {
            ensure_quote_number_available(conn, &ws_id, s, Some(id))?;
        }
        (s.to_string(), 1)
    } else if old_use == 1 {
        (next_document_number(conn, &ws_id, "DEV")?, 0)
    } else {
        (old_number, 0)
    };

    let pdf_v = input.pdf_template_variant.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() {
            None
        } else {
            Some(s.clone())
        }
    });
    conn.execute(
        "UPDATE quotes SET client_id=?1, status=?2, currency=?3, tax_exempt=?4, issue_date=?5, valid_until=?6, subtotal=?7, tax_total=?8, total=?9, notes=?10, title=?11, number=?12, use_custom_number=?13, pdf_template_variant=?14, archived=?15, discount_kind=?16, discount_value=?17, discount_label=?18, project_id=?19, updated_at=?20 WHERE id=?21",
        params![
            input.client_id,
            input.status,
            input.currency,
            if input.tax_exempt { 1 } else { 0 },
            input.issue_date,
            input.valid_until,
            subtotal,
            tax_total,
            total,
            input.notes,
            title,
            new_number,
            new_use,
            pdf_v,
            if input.archived { 1 } else { 0 },
            d_kind,
            d_val,
            d_label,
            input.project_id,
            now,
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM quote_lines WHERE quote_id = ?1", [id])
        .map_err(|e| e.to_string())?;
    for (i, line) in input.lines.iter().enumerate() {
        let lid = line
            .id
            .clone()
            .unwrap_or_else(|| Uuid::new_v4().to_string());
        let snap =
            serde_json::to_string(&line.options_snapshot_json).unwrap_or_else(|_| "{}".into());
        let (ls, lt, ltot) = details[i];
        let note = line_note_db(line);
        let (ldk, ldv, ldl) = quote_line_discount_stored(line);
        conn.execute(
            "INSERT INTO quote_lines (id, quote_id, article_id, description, options_snapshot_json, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total, sort_order, line_note, show_note_on_quote, billing_mode, line_discount_kind, line_discount_value, line_discount_label) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)",
            params![
                lid,
                id,
                line.article_id,
                line.description,
                snap,
                line.quantity,
                line.unit_price,
                line.tax_rate,
                ls,
                lt,
                ltot,
                i as i64,
                note,
                if line.show_note_on_quote { 1 } else { 0 },
                normalized_line_billing(&line.billing_mode),
                ldk,
                ldv,
                ldl,
            ],
        )
        .map_err(|e| e.to_string())?;
    }
    replace_quote_complements(conn, id, &input.complements)?;
    get_quote_conn(conn, id)
}

#[tauri::command]
pub fn update_quote(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: QuoteInput,
) -> Result<QuoteRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    update_quote_conn(&conn, &id, input)
}

#[tauri::command]
pub fn delete_quote(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM quotes WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
