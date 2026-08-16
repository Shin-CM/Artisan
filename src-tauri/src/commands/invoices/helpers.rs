use rusqlite::{params, OptionalExtension};
use uuid::Uuid;

use super::super::document_discount::{
    apply_line_discount_ht, line_discount_triple_for_db, line_discount_tuple_for_apply,
    normalize_discount_kind,
};
use super::super::types::{
    InvoiceComplementInput, InvoiceComplementRow, InvoiceInput, InvoiceLineInput, InvoiceLineRow,
};

pub(super) fn normalized_invoice_line_billing(raw: &str) -> &'static str {
    match raw.trim() {
        "flat" => "flat",
        "hourly" => "hourly",
        _ => "unit",
    }
}

pub(super) fn invoice_discount_for_apply(input: &InvoiceInput) -> (&'static str, f64) {
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

pub(super) fn invoice_discount_label_stored(input: &InvoiceInput, kind: &str) -> Option<String> {
    if kind == "none" {
        return None;
    }
    input
        .discount_label
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

pub(super) fn load_invoice_complements(
    conn: &rusqlite::Connection,
    invoice_id: &str,
) -> Result<Vec<InvoiceComplementRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, invoice_id, sort_order, snippet_id, body FROM invoice_complements WHERE invoice_id = ?1 ORDER BY sort_order",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([invoice_id], |row| {
            Ok(InvoiceComplementRow {
                id: row.get(0)?,
                invoice_id: row.get(1)?,
                sort_order: row.get(2)?,
                snippet_id: row.get(3)?,
                body: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

pub(super) fn replace_invoice_complements(
    conn: &rusqlite::Connection,
    invoice_id: &str,
    items: &[InvoiceComplementInput],
) -> Result<(), String> {
    conn.execute(
        "DELETE FROM invoice_complements WHERE invoice_id = ?1",
        [invoice_id],
    )
    .map_err(|e| e.to_string())?;
    for (i, c) in items.iter().enumerate() {
        let id = c.id.clone().unwrap_or_else(|| Uuid::new_v4().to_string());
        conn.execute(
            "INSERT INTO invoice_complements (id, invoice_id, sort_order, snippet_id, body) VALUES (?1,?2,?3,?4,?5)",
            params![id, invoice_id, i as i64, c.snippet_id, c.body],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub(super) fn load_invoice_lines(
    conn: &rusqlite::Connection,
    invoice_id: &str,
) -> Result<Vec<InvoiceLineRow>, String> {
    let mut stmt = conn
        .prepare("SELECT id, invoice_id, article_id, description, options_snapshot_json, quantity, unit_price, tax_rate, line_subtotal, line_tax, line_total, sort_order, line_note, show_note_on_invoice, billing_mode, line_discount_kind, line_discount_value, line_discount_label FROM invoice_lines WHERE invoice_id = ?1 ORDER BY sort_order")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([invoice_id], |row| {
            Ok(InvoiceLineRow {
                id: row.get(0)?,
                invoice_id: row.get(1)?,
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
                show_note_on_invoice: row.get::<_, i64>(13)? == 1,
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

pub(super) fn recalc_invoice_lines(
    lines: &[InvoiceLineInput],
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

pub(super) fn invoice_line_discount_stored(line: &InvoiceLineInput) -> (String, f64, Option<String>) {
    line_discount_triple_for_db(
        line.line_discount_kind.as_deref(),
        line.line_discount_value,
        line.line_discount_label.as_deref(),
    )
}

pub(super) fn ensure_invoice_number_available(
    conn: &rusqlite::Connection,
    workspace_id: &str,
    number: &str,
    exclude_invoice_id: Option<&str>,
) -> Result<(), String> {
    let found: Option<String> = if let Some(ex) = exclude_invoice_id {
        conn.query_row(
            "SELECT id FROM invoices WHERE workspace_id = ?1 AND number = ?2 AND id != ?3",
            rusqlite::params![workspace_id, number, ex],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
    } else {
        conn.query_row(
            "SELECT id FROM invoices WHERE workspace_id = ?1 AND number = ?2",
            rusqlite::params![workspace_id, number],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
    };
    if found.is_some() {
        return Err(format!(
            "La référence « {} » est déjà utilisée pour une autre facture dans cet espace.",
            number
        ));
    }
    Ok(())
}

pub(super) fn normalized_invoice_document_kind(raw: &str) -> &'static str {
    match raw.trim() {
        "credit_note" => "credit_note",
        _ => "invoice",
    }
}

pub(super) fn number_prefix_for_invoice_kind(kind: &str) -> &'static str {
    if kind == "credit_note" {
        "AVC"
    } else {
        "FAC"
    }
}

pub(super) fn validate_credited_invoice(
    conn: &rusqlite::Connection,
    workspace_id: &str,
    credited_id: &str,
) -> Result<(), String> {
    let row: Result<(String, String), rusqlite::Error> = conn.query_row(
        "SELECT workspace_id, document_kind FROM invoices WHERE id = ?1",
        [credited_id],
        |r| Ok((r.get(0)?, r.get(1)?)),
    );
    match row {
        Ok((ws, dk)) => {
            if ws != workspace_id {
                return Err("La facture d’origine n’appartient pas à cet espace.".to_string());
            }
            if dk == "credit_note" {
                return Err("Impossible de lier un avoir à un autre avoir.".to_string());
            }
            Ok(())
        }
        Err(_) => Err("Facture d’origine introuvable.".to_string()),
    }
}

pub(super) const LOCKED_INVOICE_DELETE_MSG: &str =
    "Impossible de supprimer une facture verrouillée. Archivez-la, créez un avoir, ou désactivez le verrouillage dans Paramètres → Espace de travail.";

/// Défaut : verrouillage actif si la clé est absente.
pub(super) fn workspace_locks_issued_invoices(profile_json: &str) -> bool {
    let Ok(v) = serde_json::from_str::<serde_json::Value>(profile_json) else {
        return true;
    };
    match v
        .pointer("/invoicePreferences/lockIssuedInvoices")
    {
        Some(serde_json::Value::Bool(b)) => *b,
        None => true,
        _ => true,
    }
}

pub(super) fn issued_invoice_content_locked(
    document_kind: &str,
    status: &str,
    profile_json: &str,
) -> bool {
    if document_kind != "invoice" {
        return false;
    }
    if status.trim() == "draft" {
        return false;
    }
    workspace_locks_issued_invoices(profile_json)
}

pub(super) fn load_workspace_profile_json(
    conn: &rusqlite::Connection,
    workspace_id: &str,
) -> String {
    conn.query_row(
        "SELECT profile_json FROM workspaces WHERE id = ?1",
        [workspace_id],
        |r| r.get::<_, String>(0),
    )
    .unwrap_or_else(|_| "{}".into())
}

