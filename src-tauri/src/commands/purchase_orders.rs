use crate::db::{next_document_number, peek_next_document_number, AppDb};
use chrono::Utc;
use rusqlite::{params, OptionalExtension};
use uuid::Uuid;

use super::document_discount::{
    apply_document_discount, apply_line_discount_ht, line_discount_triple_for_db,
    line_discount_tuple_for_apply, normalize_discount_kind,
};
use super::projects::ensure_project_belongs_to_workspace;
use super::quotes::get_quote;
use super::types::{
    PurchaseOrderComplementInput, PurchaseOrderComplementRow, PurchaseOrderInput,
    PurchaseOrderLineInput, PurchaseOrderLineRow, PurchaseOrderRow,
};

fn purchase_order_discount_for_apply(input: &PurchaseOrderInput) -> (&'static str, f64) {
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

fn purchase_order_discount_label_stored(input: &PurchaseOrderInput, kind: &str) -> Option<String> {
    if kind == "none" {
        return None;
    }
    input
        .discount_label
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

fn recalc_purchase_order_totals(
    lines: &[PurchaseOrderLineInput],
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

fn purchase_order_line_discount_stored(
    line: &PurchaseOrderLineInput,
) -> (String, f64, Option<String>) {
    line_discount_triple_for_db(
        line.line_discount_kind.as_deref(),
        line.line_discount_value,
        line.line_discount_label.as_deref(),
    )
}

fn ensure_purchase_order_number_available(
    conn: &rusqlite::Connection,
    workspace_id: &str,
    number: &str,
    exclude_purchase_order_id: Option<&str>,
) -> Result<(), String> {
    let found: Option<String> = if let Some(ex) = exclude_purchase_order_id {
        conn.query_row(
            "SELECT id FROM purchase_orders WHERE workspace_id = ?1 AND number = ?2 AND id != ?3",
            rusqlite::params![workspace_id, number, ex],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
    } else {
        conn.query_row(
            "SELECT id FROM purchase_orders WHERE workspace_id = ?1 AND number = ?2",
            rusqlite::params![workspace_id, number],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
    };
    if found.is_some() {
        return Err(format!(
            "La référence « {} » est déjà utilisée pour un autre bon de commande dans cet espace.",
            number
        ));
    }
    Ok(())
}

#[tauri::command]
pub fn list_purchase_orders(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<PurchaseOrderRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, client_id, number, title, use_custom_number, status, currency, tax_exempt, issue_date, valid_until, subtotal, tax_total, total, discount_kind, discount_value, discount_label, notes, pdf_template_variant, archived, project_id FROM purchase_orders WHERE workspace_id = ?1 ORDER BY issue_date DESC, created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let base: Vec<_> = stmt
        .query_map([&workspace_id], |row| {
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
        let lines = load_purchase_order_lines(&conn, &id)?;
        let complements = load_purchase_order_complements(&conn, &id)?;
        out.push(PurchaseOrderRow {
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

fn normalized_po_line_billing(raw: &str) -> &'static str {
    match raw.trim() {
        "flat" => "flat",
        "hourly" => "hourly",
        _ => "unit",
    }
}

fn line_note_db(input: &PurchaseOrderLineInput) -> Option<String> {
    input
        .line_note
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

fn load_purchase_order_complements(
    conn: &rusqlite::Connection,
    purchase_order_id: &str,
) -> Result<Vec<PurchaseOrderComplementRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, purchase_order_id, sort_order, snippet_id, body FROM purchase_order_complements WHERE purchase_order_id = ?1 ORDER BY sort_order",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([purchase_order_id], |row| {
            Ok(PurchaseOrderComplementRow {
                id: row.get(0)?,
                purchase_order_id: row.get(1)?,
                sort_order: row.get(2)?,
                snippet_id: row.get(3)?,
                body: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

fn replace_purchase_order_complements(
    conn: &rusqlite::Connection,
    purchase_order_id: &str,
    items: &[PurchaseOrderComplementInput],
) -> Result<(), String> {
    conn.execute(
        "DELETE FROM purchase_order_complements WHERE purchase_order_id = ?1",
        [purchase_order_id],
    )
    .map_err(|e| e.to_string())?;
    for (i, c) in items.iter().enumerate() {
        let id = c.id.clone().unwrap_or_else(|| Uuid::new_v4().to_string());
        conn.execute(
            "INSERT INTO purchase_order_complements (id, purchase_order_id, sort_order, snippet_id, body) VALUES (?1,?2,?3,?4,?5)",
            params![id, purchase_order_id, i as i64, c.snippet_id, c.body],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn load_purchase_order_lines(
    conn: &rusqlite::Connection,
    purchase_order_id: &str,
) -> Result<Vec<PurchaseOrderLineRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, purchase_order_id, article_id, description, options_snapshot_json, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total, sort_order, line_note, show_note_on_purchase_order, billing_mode, line_discount_kind, line_discount_value, line_discount_label FROM purchase_order_lines WHERE purchase_order_id = ?1 ORDER BY sort_order",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([purchase_order_id], |row| {
            Ok(PurchaseOrderLineRow {
                id: row.get(0)?,
                purchase_order_id: row.get(1)?,
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
                show_note_on_purchase_order: row.get::<_, i64>(13)? == 1,
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
pub fn peek_next_purchase_order_number(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<String, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    peek_next_document_number(&conn, &workspace_id, "BDC")
}

#[tauri::command]
pub fn create_purchase_order(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: PurchaseOrderInput,
) -> Result<PurchaseOrderRow, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let (details, gross_sub, gross_tax, _) =
        recalc_purchase_order_totals(&input.lines, input.tax_exempt);
    let (d_kind, d_val) = purchase_order_discount_for_apply(&input);
    let (subtotal, tax_total, total) =
        apply_document_discount(gross_sub, gross_tax, input.tax_exempt, d_kind, d_val);
    let d_label = purchase_order_discount_label_stored(&input, d_kind);
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    ensure_project_belongs_to_workspace(&conn, &workspace_id, input.project_id.as_deref())?;
    let title = input.title.as_deref().unwrap_or("").trim().to_string();
    let use_c = input.use_custom_number;
    let (number, use_custom_number): (String, i64) = if use_c {
        let s = input
            .custom_number
            .as_deref()
            .map(str::trim)
            .filter(|x| !x.is_empty())
            .ok_or_else(|| "Indiquez une référence de bon de commande.".to_string())?;
        ensure_purchase_order_number_available(&conn, &workspace_id, s, None)?;
        (s.to_string(), 1)
    } else {
        (next_document_number(&conn, &workspace_id, "BDC")?, 0)
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
        "INSERT INTO purchase_orders (id, workspace_id, client_id, number, title, use_custom_number, status, currency, tax_exempt, issue_date, valid_until, subtotal, tax_total, total, notes, pdf_template_variant, archived, discount_kind, discount_value, discount_label, project_id, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23)",
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
        let (ldk, ldv, ldl) = purchase_order_line_discount_stored(line);
        conn.execute(
            "INSERT INTO purchase_order_lines (id, purchase_order_id, article_id, description, options_snapshot_json, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total, sort_order, line_note, show_note_on_purchase_order, billing_mode, line_discount_kind, line_discount_value, line_discount_label) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)",
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
                if line.show_note_on_purchase_order { 1 } else { 0 },
                normalized_po_line_billing(&line.billing_mode),
                ldk,
                ldv,
                ldl,
            ],
        )
        .map_err(|e| e.to_string())?;
    }
    replace_purchase_order_complements(&conn, &id, &input.complements)?;
    drop(conn);
    get_purchase_order(db, id)
}

#[tauri::command]
pub fn get_purchase_order(
    db: tauri::State<'_, AppDb>,
    id: String,
) -> Result<PurchaseOrderRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let row = conn
        .query_row(
            "SELECT id, workspace_id, client_id, number, title, use_custom_number, status, currency, tax_exempt, issue_date, valid_until, subtotal, tax_total, total, discount_kind, discount_value, discount_label, notes, pdf_template_variant, archived, project_id FROM purchase_orders WHERE id = ?1",
            [&id],
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
    let lines = load_purchase_order_lines(&conn, &id)?;
    let (
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
    ) = row;
    let complements = load_purchase_order_complements(&conn, &id)?;
    Ok(PurchaseOrderRow {
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
    })
}

#[tauri::command]
pub fn update_purchase_order(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: PurchaseOrderInput,
) -> Result<PurchaseOrderRow, String> {
    let now = Utc::now().to_rfc3339();
    let (details, gross_sub, gross_tax, _) =
        recalc_purchase_order_totals(&input.lines, input.tax_exempt);
    let (d_kind, d_val) = purchase_order_discount_for_apply(&input);
    let (subtotal, tax_total, total) =
        apply_document_discount(gross_sub, gross_tax, input.tax_exempt, d_kind, d_val);
    let d_label = purchase_order_discount_label_stored(&input, d_kind);
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let (ws_id, old_number, old_use): (String, String, i64) = conn
        .query_row(
            "SELECT workspace_id, number, use_custom_number FROM purchase_orders WHERE id = ?1",
            [&id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .map_err(|e| e.to_string())?;

    ensure_project_belongs_to_workspace(&conn, &ws_id, input.project_id.as_deref())?;

    let title = input.title.as_deref().unwrap_or("").trim().to_string();
    let use_c = input.use_custom_number;

    let (new_number, new_use): (String, i64) = if use_c {
        let s = input
            .custom_number
            .as_deref()
            .map(str::trim)
            .filter(|x| !x.is_empty())
            .ok_or_else(|| "Indiquez une référence de bon de commande.".to_string())?;
        if s != old_number.as_str() {
            ensure_purchase_order_number_available(&conn, &ws_id, s, Some(&id))?;
        }
        (s.to_string(), 1)
    } else if old_use == 1 {
        (next_document_number(&conn, &ws_id, "BDC")?, 0)
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
        "UPDATE purchase_orders SET client_id=?1, status=?2, currency=?3, tax_exempt=?4, issue_date=?5, valid_until=?6, subtotal=?7, tax_total=?8, total=?9, notes=?10, title=?11, number=?12, use_custom_number=?13, pdf_template_variant=?14, archived=?15, discount_kind=?16, discount_value=?17, discount_label=?18, project_id=?19, updated_at=?20 WHERE id=?21",
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
    conn.execute(
        "DELETE FROM purchase_order_lines WHERE purchase_order_id = ?1",
        [&id],
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
        let (ldk, ldv, ldl) = purchase_order_line_discount_stored(line);
        conn.execute(
            "INSERT INTO purchase_order_lines (id, purchase_order_id, article_id, description, options_snapshot_json, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total, sort_order, line_note, show_note_on_purchase_order, billing_mode, line_discount_kind, line_discount_value, line_discount_label) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)",
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
                if line.show_note_on_purchase_order { 1 } else { 0 },
                normalized_po_line_billing(&line.billing_mode),
                ldk,
                ldv,
                ldl,
            ],
        )
        .map_err(|e| e.to_string())?;
    }
    replace_purchase_order_complements(&conn, &id, &input.complements)?;
    drop(conn);
    get_purchase_order(db, id)
}

#[tauri::command]
pub fn delete_purchase_order(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM purchase_orders WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Crée un bon de commande brouillon à partir d’un devis (lignes, compléments, remise globale).
#[tauri::command]
pub fn convert_quote_to_purchase_order(
    db: tauri::State<'_, AppDb>,
    quote_id: String,
    workspace_id: String,
) -> Result<PurchaseOrderRow, String> {
    let q = get_quote(db.clone(), quote_id.clone())?;
    if q.workspace_id != workspace_id {
        return Err("Devis introuvable".to_string());
    }
    let line_inputs: Vec<PurchaseOrderLineInput> = q
        .lines
        .iter()
        .map(|l| PurchaseOrderLineInput {
            id: None,
            article_id: l.article_id.clone(),
            description: l.description.clone(),
            options_snapshot_json: serde_json::from_str(&l.options_snapshot_json)
                .unwrap_or_else(|_| serde_json::json!({})),
            quantity: l.quantity,
            unit_price: l.unit_price,
            tax_rate: l.tax_rate,
            line_note: l.line_note.clone(),
            show_note_on_purchase_order: l.show_note_on_quote,
            billing_mode: l.billing_mode.clone(),
            line_discount_kind: Some(l.line_discount_kind.clone()),
            line_discount_value: Some(l.line_discount_value),
            line_discount_label: l.line_discount_label.clone(),
        })
        .collect();
    let comp_inputs: Vec<PurchaseOrderComplementInput> = q
        .complements
        .iter()
        .map(|c| PurchaseOrderComplementInput {
            id: None,
            snippet_id: c.snippet_id.clone(),
            body: c.body.clone(),
        })
        .collect();
    let input = PurchaseOrderInput {
        title: Some(q.title.clone()),
        use_custom_number: false,
        custom_number: None,
        client_id: q.client_id.clone(),
        status: "draft".into(),
        currency: q.currency.clone(),
        tax_exempt: q.tax_exempt,
        issue_date: Utc::now().format("%Y-%m-%d").to_string(),
        valid_until: q.valid_until.clone(),
        notes: q.notes.clone(),
        pdf_template_variant: q.pdf_template_variant.clone(),
        lines: line_inputs,
        complements: comp_inputs,
        archived: false,
        discount_kind: Some(q.discount_kind.clone()),
        discount_value: Some(q.discount_value),
        discount_label: q.discount_label.clone(),
        project_id: q.project_id.clone(),
    };
    create_purchase_order(db, workspace_id, input)
}
