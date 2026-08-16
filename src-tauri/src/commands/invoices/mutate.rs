use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use crate::db::{next_document_number, AppDb};

use super::super::document_discount::apply_document_discount;
use super::super::projects::ensure_project_belongs_to_workspace;
use super::super::types::{InvoiceInput, InvoiceRow};
use super::helpers::{
    ensure_invoice_number_available, issued_invoice_content_locked, invoice_discount_for_apply,
    invoice_discount_label_stored, invoice_line_discount_stored, load_workspace_profile_json,
    normalized_invoice_document_kind, normalized_invoice_line_billing,
    number_prefix_for_invoice_kind, recalc_invoice_lines, replace_invoice_complements,
    validate_credited_invoice, LOCKED_INVOICE_DELETE_MSG,
};
use super::query::get_invoice;

#[tauri::command]
pub fn create_invoice(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
    input: InvoiceInput,
) -> Result<InvoiceRow, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let (details, gross_sub, gross_tax, _) = recalc_invoice_lines(&input.lines, input.tax_exempt);
    let (d_kind, d_val) = invoice_discount_for_apply(&input);
    let (subtotal, tax_total, total) =
        apply_document_discount(gross_sub, gross_tax, input.tax_exempt, d_kind, d_val);
    let d_label = invoice_discount_label_stored(&input, d_kind);
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    ensure_project_belongs_to_workspace(&conn, &workspace_id, input.project_id.as_deref())?;
    let doc_kind = normalized_invoice_document_kind(&input.document_kind);
    if doc_kind == "credit_note" {
        if let Some(ref cid) = input.credited_invoice_id {
            let t = cid.trim();
            if !t.is_empty() {
                validate_credited_invoice(&conn, &workspace_id, t)?;
            }
        }
    }
    let credited_stored = input
        .credited_invoice_id
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let use_c = input.use_custom_number;
    let (number, use_custom_number): (String, i64) = if use_c {
        let s = input
            .custom_number
            .as_deref()
            .map(str::trim)
            .filter(|x| !x.is_empty())
            .ok_or_else(|| "Indiquez une référence de facture.".to_string())?;
        ensure_invoice_number_available(&conn, &workspace_id, s, None)?;
        (s.to_string(), 1)
    } else {
        let pfx = number_prefix_for_invoice_kind(doc_kind);
        (next_document_number(&conn, &workspace_id, pfx)?, 0)
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
        "INSERT INTO invoices (id, workspace_id, client_id, quote_id, number, document_kind, credited_invoice_id, use_custom_number, status, currency, tax_exempt, issue_date, due_date, subtotal, tax_total, total, amount_paid, notes, pdf_template_variant, archived, discount_kind, discount_value, discount_label, project_id, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?25,?26)",
        params![
            id,
            workspace_id,
            input.client_id,
            input.quote_id,
            number,
            doc_kind,
            credited_stored,
            use_custom_number,
            input.status,
            input.currency,
            if input.tax_exempt { 1 } else { 0 },
            input.issue_date,
            input.due_date,
            subtotal,
            tax_total,
            total,
            input.amount_paid,
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
        let (ldk, ldv, ldl) = invoice_line_discount_stored(line);
        conn.execute(
            "INSERT INTO invoice_lines (id, invoice_id, article_id, description, options_snapshot_json, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total, sort_order, line_note, show_note_on_invoice, billing_mode, line_discount_kind, line_discount_value, line_discount_label) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)",
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
                line.line_note,
                if line.show_note_on_invoice { 1 } else { 0 },
                normalized_invoice_line_billing(&line.billing_mode),
                ldk,
                ldv,
                ldl,
            ],
        )
        .map_err(|e| e.to_string())?;
    }
    replace_invoice_complements(&conn, &id, &input.complements)?;
    drop(conn);
    get_invoice(db, id)
}

#[tauri::command]
pub fn update_invoice(
    db: tauri::State<'_, AppDb>,
    id: String,
    input: InvoiceInput,
) -> Result<InvoiceRow, String> {
    let now = Utc::now().to_rfc3339();
    let (details, gross_sub, gross_tax, _) = recalc_invoice_lines(&input.lines, input.tax_exempt);
    let (d_kind, d_val) = invoice_discount_for_apply(&input);
    let (subtotal, tax_total, total) =
        apply_document_discount(gross_sub, gross_tax, input.tax_exempt, d_kind, d_val);
    let d_label = invoice_discount_label_stored(&input, d_kind);
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let (ws_id, old_number, old_use, old_doc_kind, old_status): (
        String,
        String,
        i64,
        String,
        String,
    ) = conn
            .query_row(
                "SELECT workspace_id, number, use_custom_number, document_kind, status FROM invoices WHERE id = ?1",
                [&id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
            )
            .map_err(|e| e.to_string())?;

    let input_dk = normalized_invoice_document_kind(&input.document_kind);
    if input_dk != old_doc_kind.as_str() {
        return Err("Le type de document ne peut pas être modifié.".to_string());
    }

    let profile_json = load_workspace_profile_json(&conn, &ws_id);
    let content_locked =
        issued_invoice_content_locked(&old_doc_kind, &old_status, &profile_json);
    if content_locked {
        if input.status.trim() == "draft" {
            return Err(
                "Impossible de repasser une facture verrouillée en brouillon.".to_string(),
            );
        }
        let now_locked = Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE invoices SET status=?1, amount_paid=?2, archived=?3, updated_at=?4 WHERE id=?5",
            params![
                input.status,
                input.amount_paid,
                if input.archived { 1 } else { 0 },
                now_locked,
                id
            ],
        )
        .map_err(|e| e.to_string())?;
        drop(conn);
        return get_invoice(db, id);
    }

    let credited_stored = input
        .credited_invoice_id
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    if old_doc_kind == "credit_note" {
        if let Some(ref t) = credited_stored {
            validate_credited_invoice(&conn, &ws_id, t)?;
        }
    }

    ensure_project_belongs_to_workspace(&conn, &ws_id, input.project_id.as_deref())?;

    let use_c = input.use_custom_number;

    let pfx = number_prefix_for_invoice_kind(old_doc_kind.as_str());
    let (new_number, new_use): (String, i64) = if use_c {
        let s = input
            .custom_number
            .as_deref()
            .map(str::trim)
            .filter(|x| !x.is_empty())
            .ok_or_else(|| "Indiquez une référence de facture.".to_string())?;
        if s != old_number.as_str() {
            ensure_invoice_number_available(&conn, &ws_id, s, Some(&id))?;
        }
        (s.to_string(), 1)
    } else if old_use == 1 {
        (next_document_number(&conn, &ws_id, pfx)?, 0)
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
        "UPDATE invoices SET client_id=?1, quote_id=?2, number=?3, use_custom_number=?4, status=?5, currency=?6, tax_exempt=?7, issue_date=?8, due_date=?9, subtotal=?10, tax_total=?11, total=?12, amount_paid=?13, notes=?14, pdf_template_variant=?15, archived=?16, discount_kind=?17, discount_value=?18, discount_label=?19, credited_invoice_id=?20, project_id=?21, updated_at=?22 WHERE id=?23",
        params![
            input.client_id,
            input.quote_id,
            new_number,
            new_use,
            input.status,
            input.currency,
            if input.tax_exempt { 1 } else { 0 },
            input.issue_date,
            input.due_date,
            subtotal,
            tax_total,
            total,
            input.amount_paid,
            input.notes,
            pdf_v,
            if input.archived { 1 } else { 0 },
            d_kind,
            d_val,
            d_label,
            credited_stored,
            input.project_id,
            now,
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM invoice_lines WHERE invoice_id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    for (i, line) in input.lines.iter().enumerate() {
        let lid = line
            .id
            .clone()
            .unwrap_or_else(|| Uuid::new_v4().to_string());
        let snap =
            serde_json::to_string(&line.options_snapshot_json).unwrap_or_else(|_| "{}".into());
        let (ls, lt, ltot) = details[i];
        let (ldk, ldv, ldl) = invoice_line_discount_stored(line);
        conn.execute(
            "INSERT INTO invoice_lines (id, invoice_id, article_id, description, options_snapshot_json, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total, sort_order, line_note, show_note_on_invoice, billing_mode, line_discount_kind, line_discount_value, line_discount_label) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)",
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
                line.line_note,
                if line.show_note_on_invoice { 1 } else { 0 },
                normalized_invoice_line_billing(&line.billing_mode),
                ldk,
                ldv,
                ldl,
            ],
        )
        .map_err(|e| e.to_string())?;
    }
    replace_invoice_complements(&conn, &id, &input.complements)?;
    drop(conn);
    get_invoice(db, id)
}

#[tauri::command]
pub fn delete_invoice(db: tauri::State<'_, AppDb>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let (ws_id, doc_kind, status): (String, String, String) = conn
        .query_row(
            "SELECT workspace_id, document_kind, status FROM invoices WHERE id = ?1",
            [&id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .map_err(|_| "Facture introuvable.".to_string())?;
    let profile_json = load_workspace_profile_json(&conn, &ws_id);
    if issued_invoice_content_locked(&doc_kind, &status, &profile_json) {
        return Err(LOCKED_INVOICE_DELETE_MSG.to_string());
    }
    conn.execute("DELETE FROM invoices WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
