use crate::db::AppDb;

use super::super::quotes::get_quote;
use super::super::types::{InvoiceComplementInput, InvoiceInput, InvoiceLineInput, InvoiceRow};
use super::mutate::create_invoice;

#[tauri::command]
pub fn convert_quote_to_invoice(
    db: tauri::State<'_, AppDb>,
    quote_id: String,
    workspace_id: String,
) -> Result<InvoiceRow, String> {
    let q = get_quote(db.clone(), quote_id.clone())?;
    let line_inputs: Vec<InvoiceLineInput> = q
        .lines
        .iter()
        .map(|l| InvoiceLineInput {
            id: None,
            article_id: l.article_id.clone(),
            description: l.description.clone(),
            options_snapshot_json: serde_json::from_str(&l.options_snapshot_json)
                .unwrap_or_else(|_| serde_json::json!({})),
            quantity: l.quantity,
            unit_price: l.unit_price,
            tax_rate: l.tax_rate,
            line_note: l.line_note.clone(),
            show_note_on_invoice: l.show_note_on_quote,
            billing_mode: l.billing_mode.clone(),
            line_discount_kind: Some(l.line_discount_kind.clone()),
            line_discount_value: Some(l.line_discount_value),
            line_discount_label: l.line_discount_label.clone(),
        })
        .collect();
    let comp_inputs: Vec<InvoiceComplementInput> = q
        .complements
        .iter()
        .map(|c| InvoiceComplementInput {
            id: None,
            snippet_id: c.snippet_id.clone(),
            body: c.body.clone(),
        })
        .collect();
    let inv = InvoiceInput {
        document_kind: "invoice".into(),
        credited_invoice_id: None,
        use_custom_number: false,
        custom_number: None,
        client_id: q.client_id.clone(),
        quote_id: Some(quote_id),
        status: "draft".into(),
        currency: q.currency.clone(),
        tax_exempt: q.tax_exempt,
        issue_date: chrono::Utc::now().format("%Y-%m-%d").to_string(),
        due_date: None,
        amount_paid: 0.0,
        notes: q.notes.clone(),
        pdf_template_variant: q.pdf_template_variant.clone(),
        archived: false,
        lines: line_inputs,
        complements: comp_inputs,
        discount_kind: Some(q.discount_kind.clone()),
        discount_value: Some(q.discount_value),
        discount_label: q.discount_label.clone(),
        project_id: q.project_id.clone(),
    };
    create_invoice(db, workspace_id, inv)
}

#[tauri::command]
pub fn convert_purchase_order_to_invoice(
    db: tauri::State<'_, AppDb>,
    purchase_order_id: String,
    workspace_id: String,
) -> Result<InvoiceRow, String> {
    let po = crate::commands::purchase_orders::get_purchase_order(
        db.clone(),
        purchase_order_id.clone(),
    )?;
    let line_inputs: Vec<InvoiceLineInput> = po
        .lines
        .iter()
        .map(|l| InvoiceLineInput {
            id: None,
            article_id: l.article_id.clone(),
            description: l.description.clone(),
            options_snapshot_json: serde_json::from_str(&l.options_snapshot_json)
                .unwrap_or_else(|_| serde_json::json!({})),
            quantity: l.quantity,
            unit_price: l.unit_price,
            tax_rate: l.tax_rate,
            line_note: l.line_note.clone(),
            show_note_on_invoice: l.show_note_on_purchase_order,
            billing_mode: l.billing_mode.clone(),
            line_discount_kind: Some(l.line_discount_kind.clone()),
            line_discount_value: Some(l.line_discount_value),
            line_discount_label: l.line_discount_label.clone(),
        })
        .collect();
    let comp_inputs: Vec<InvoiceComplementInput> = po
        .complements
        .iter()
        .map(|c| InvoiceComplementInput {
            id: None,
            snippet_id: c.snippet_id.clone(),
            body: c.body.clone(),
        })
        .collect();
    let inv = InvoiceInput {
        document_kind: "invoice".into(),
        credited_invoice_id: None,
        use_custom_number: false,
        custom_number: None,
        client_id: po.client_id.clone(),
        quote_id: None,
        status: "draft".into(),
        currency: po.currency.clone(),
        tax_exempt: po.tax_exempt,
        issue_date: chrono::Utc::now().format("%Y-%m-%d").to_string(),
        due_date: None,
        amount_paid: 0.0,
        notes: po.notes.clone(),
        pdf_template_variant: po.pdf_template_variant.clone(),
        archived: false,
        lines: line_inputs,
        complements: comp_inputs,
        discount_kind: Some(po.discount_kind.clone()),
        discount_value: Some(po.discount_value),
        discount_label: po.discount_label.clone(),
        project_id: po.project_id.clone(),
    };
    create_invoice(db, workspace_id, inv)
}
