use crate::db::{peek_next_document_number, AppDb};

use super::super::types::{InvoiceComplementRow, InvoiceLineRow, InvoiceRow};
use super::helpers::{load_invoice_complements, load_invoice_lines};

const INVOICE_SELECT: &str = "SELECT id, workspace_id, client_id, quote_id, number, document_kind, credited_invoice_id, use_custom_number, status, currency, tax_exempt, issue_date, due_date, subtotal, tax_total, total, amount_paid, discount_kind, discount_value, discount_label, notes, pdf_template_variant, archived, project_id FROM invoices";

type InvoiceBase = (
    String,
    String,
    Option<String>,
    Option<String>,
    String,
    String,
    Option<String>,
    bool,
    String,
    String,
    bool,
    String,
    Option<String>,
    f64,
    f64,
    f64,
    f64,
    String,
    f64,
    Option<String>,
    Option<String>,
    Option<String>,
    bool,
    Option<String>,
);

fn map_invoice_base_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<InvoiceBase> {
    Ok((
        row.get::<_, String>(0)?,
        row.get::<_, String>(1)?,
        row.get::<_, Option<String>>(2)?,
        row.get::<_, Option<String>>(3)?,
        row.get::<_, String>(4)?,
        row.get::<_, String>(5)?,
        row.get::<_, Option<String>>(6)?,
        row.get::<_, i64>(7)? == 1,
        row.get::<_, String>(8)?,
        row.get::<_, String>(9)?,
        row.get::<_, i64>(10)? == 1,
        row.get::<_, String>(11)?,
        row.get::<_, Option<String>>(12)?,
        row.get::<_, f64>(13)?,
        row.get::<_, f64>(14)?,
        row.get::<_, f64>(15)?,
        row.get::<_, f64>(16)?,
        row.get::<_, String>(17)?,
        row.get::<_, f64>(18)?,
        row.get::<_, Option<String>>(19)?,
        row.get::<_, Option<String>>(20)?,
        row.get::<_, Option<String>>(21)?,
        row.get::<_, i64>(22)? == 1,
        row.get::<_, Option<String>>(23)?,
    ))
}

fn invoice_row_from_base(
    base: InvoiceBase,
    lines: Vec<InvoiceLineRow>,
    complements: Vec<InvoiceComplementRow>,
) -> InvoiceRow {
    let (
        id,
        ws,
        client_id,
        quote_id,
        number,
        document_kind,
        credited_invoice_id,
        use_custom_number,
        status,
        currency,
        tax_exempt,
        issue_date,
        due_date,
        subtotal,
        tax_total,
        total,
        amount_paid,
        discount_kind,
        discount_value,
        discount_label,
        notes,
        pdf_template_variant,
        archived,
        project_id,
    ) = base;
    InvoiceRow {
        id,
        workspace_id: ws,
        client_id,
        quote_id,
        number,
        document_kind,
        credited_invoice_id,
        use_custom_number,
        status,
        currency,
        tax_exempt,
        issue_date,
        due_date,
        subtotal,
        tax_total,
        total,
        amount_paid,
        discount_kind,
        discount_value,
        discount_label,
        notes,
        pdf_template_variant,
        archived,
        project_id,
        lines,
        complements,
    }
}

fn list_invoices_of_kind(
    conn: &rusqlite::Connection,
    workspace_id: &str,
    document_kind: &str,
) -> Result<Vec<InvoiceRow>, String> {
    let sql = format!(
        "{} WHERE workspace_id = ?1 AND document_kind = ?2 ORDER BY issue_date DESC",
        INVOICE_SELECT
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let base: Vec<_> = stmt
        .query_map(rusqlite::params![workspace_id, document_kind], map_invoice_base_row)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for row in base {
        let id = row.0.clone();
        let lines = load_invoice_lines(conn, &id)?;
        let complements = load_invoice_complements(conn, &id)?;
        out.push(invoice_row_from_base(row, lines, complements));
    }
    Ok(out)
}

#[tauri::command]
pub fn peek_next_invoice_number(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<String, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    peek_next_document_number(&conn, &workspace_id, "FAC")
}

#[tauri::command]
pub fn peek_next_credit_note_number(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<String, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    peek_next_document_number(&conn, &workspace_id, "AVC")
}

#[tauri::command]
pub fn list_invoices(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<InvoiceRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    list_invoices_of_kind(&conn, &workspace_id, "invoice")
}

#[tauri::command]
pub fn list_credit_notes(
    db: tauri::State<'_, AppDb>,
    workspace_id: String,
) -> Result<Vec<InvoiceRow>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    list_invoices_of_kind(&conn, &workspace_id, "credit_note")
}

#[tauri::command]
pub fn get_invoice(db: tauri::State<'_, AppDb>, id: String) -> Result<InvoiceRow, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let sql = format!("{} WHERE id = ?1", INVOICE_SELECT);
    let row = conn
        .query_row(&sql, [&id], map_invoice_base_row)
        .map_err(|e| e.to_string())?;
    let lines = load_invoice_lines(&conn, &id)?;
    let complements = load_invoice_complements(&conn, &id)?;
    Ok(invoice_row_from_base(row, lines, complements))
}
