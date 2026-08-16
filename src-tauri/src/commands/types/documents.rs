use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuoteLineRow {
    pub id: String,
    pub quote_id: String,
    pub article_id: Option<String>,
    pub description: String,
    pub options_snapshot_json: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub tax_rate: f64,
    pub line_subtotal: f64,
    pub line_tax: f64,
    pub line_total: f64,
    pub sort_order: i64,
    pub line_note: Option<String>,
    pub show_note_on_quote: bool,
    pub billing_mode: String,
    #[serde(default = "default_discount_kind_str")]
    pub line_discount_kind: String,
    #[serde(default)]
    pub line_discount_value: f64,
    pub line_discount_label: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuoteComplementRow {
    pub id: String,
    pub quote_id: String,
    pub sort_order: i64,
    pub snippet_id: Option<String>,
    pub body: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteComplementInput {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub snippet_id: Option<String>,
    #[serde(default)]
    pub body: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteRow {
    pub id: String,
    pub workspace_id: String,
    pub client_id: Option<String>,
    pub number: String,
    pub title: String,
    pub use_custom_number: bool,
    pub status: String,
    pub currency: String,
    pub tax_exempt: bool,
    pub issue_date: String,
    pub valid_until: Option<String>,
    pub subtotal: f64,
    pub tax_total: f64,
    pub total: f64,
    #[serde(default = "default_discount_kind_str")]
    pub discount_kind: String,
    #[serde(default)]
    pub discount_value: f64,
    pub discount_label: Option<String>,
    pub notes: Option<String>,
    #[serde(default)]
    pub pdf_template_variant: Option<String>,
    #[serde(default)]
    pub archived: bool,
    #[serde(default)]
    pub project_id: Option<String>,
    pub lines: Vec<QuoteLineRow>,
    pub complements: Vec<QuoteComplementRow>,
}

fn default_discount_kind_str() -> String {
    "none".into()
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteLineInput {
    pub id: Option<String>,
    pub article_id: Option<String>,
    pub description: String,
    #[serde(default)]
    pub options_snapshot_json: serde_json::Value,
    pub quantity: f64,
    pub unit_price: f64,
    pub tax_rate: f64,
    #[serde(default)]
    pub line_note: Option<String>,
    #[serde(default)]
    pub show_note_on_quote: bool,
    #[serde(default)]
    pub billing_mode: String,
    #[serde(default)]
    pub line_discount_kind: Option<String>,
    #[serde(default)]
    pub line_discount_value: Option<f64>,
    #[serde(default)]
    pub line_discount_label: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteInput {
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub use_custom_number: bool,
    #[serde(default)]
    pub custom_number: Option<String>,
    pub client_id: Option<String>,
    pub status: String,
    pub currency: String,
    pub tax_exempt: bool,
    pub issue_date: String,
    pub valid_until: Option<String>,
    pub notes: Option<String>,
    #[serde(default)]
    pub pdf_template_variant: Option<String>,
    pub lines: Vec<QuoteLineInput>,
    #[serde(default)]
    pub complements: Vec<QuoteComplementInput>,
    #[serde(default)]
    pub archived: bool,
    #[serde(default)]
    pub discount_kind: Option<String>,
    #[serde(default)]
    pub discount_value: Option<f64>,
    #[serde(default)]
    pub discount_label: Option<String>,
    #[serde(default)]
    pub project_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceLineRow {
    pub id: String,
    pub invoice_id: String,
    pub article_id: Option<String>,
    pub description: String,
    pub options_snapshot_json: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub tax_rate: f64,
    pub line_subtotal: f64,
    pub line_tax: f64,
    pub line_total: f64,
    pub sort_order: i64,
    pub line_note: Option<String>,
    pub show_note_on_invoice: bool,
    pub billing_mode: String,
    #[serde(default = "default_discount_kind_str")]
    pub line_discount_kind: String,
    #[serde(default)]
    pub line_discount_value: f64,
    pub line_discount_label: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceComplementRow {
    pub id: String,
    pub invoice_id: String,
    pub sort_order: i64,
    pub snippet_id: Option<String>,
    pub body: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceComplementInput {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub snippet_id: Option<String>,
    #[serde(default)]
    pub body: String,
}

fn default_invoice_document_kind() -> String {
    "invoice".into()
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceRow {
    pub id: String,
    pub workspace_id: String,
    pub client_id: Option<String>,
    pub quote_id: Option<String>,
    pub number: String,
    #[serde(default = "default_invoice_document_kind")]
    pub document_kind: String,
    #[serde(default)]
    pub credited_invoice_id: Option<String>,
    #[serde(default)]
    pub use_custom_number: bool,
    pub status: String,
    pub currency: String,
    pub tax_exempt: bool,
    pub issue_date: String,
    pub due_date: Option<String>,
    pub subtotal: f64,
    pub tax_total: f64,
    pub total: f64,
    pub amount_paid: f64,
    #[serde(default = "default_discount_kind_str")]
    pub discount_kind: String,
    #[serde(default)]
    pub discount_value: f64,
    pub discount_label: Option<String>,
    pub notes: Option<String>,
    #[serde(default)]
    pub pdf_template_variant: Option<String>,
    #[serde(default)]
    pub archived: bool,
    #[serde(default)]
    pub project_id: Option<String>,
    pub lines: Vec<InvoiceLineRow>,
    pub complements: Vec<InvoiceComplementRow>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceLineInput {
    pub id: Option<String>,
    pub article_id: Option<String>,
    pub description: String,
    #[serde(default)]
    pub options_snapshot_json: serde_json::Value,
    pub quantity: f64,
    pub unit_price: f64,
    pub tax_rate: f64,
    #[serde(default)]
    pub line_note: Option<String>,
    #[serde(default)]
    pub show_note_on_invoice: bool,
    #[serde(default)]
    pub billing_mode: String,
    #[serde(default)]
    pub line_discount_kind: Option<String>,
    #[serde(default)]
    pub line_discount_value: Option<f64>,
    #[serde(default)]
    pub line_discount_label: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceInput {
    #[serde(default = "default_invoice_document_kind")]
    pub document_kind: String,
    #[serde(default)]
    pub credited_invoice_id: Option<String>,
    #[serde(default)]
    pub use_custom_number: bool,
    #[serde(default)]
    pub custom_number: Option<String>,
    pub client_id: Option<String>,
    pub quote_id: Option<String>,
    pub status: String,
    pub currency: String,
    pub tax_exempt: bool,
    pub issue_date: String,
    pub due_date: Option<String>,
    pub amount_paid: f64,
    pub notes: Option<String>,
    #[serde(default)]
    pub pdf_template_variant: Option<String>,
    pub lines: Vec<InvoiceLineInput>,
    #[serde(default)]
    pub complements: Vec<InvoiceComplementInput>,
    #[serde(default)]
    pub archived: bool,
    #[serde(default)]
    pub discount_kind: Option<String>,
    #[serde(default)]
    pub discount_value: Option<f64>,
    #[serde(default)]
    pub discount_label: Option<String>,
    #[serde(default)]
    pub project_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscountPresetRow {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub kind: String,
    pub value: f64,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscountPresetInput {
    pub name: String,
    pub kind: String,
    pub value: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextSnippetRow {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub body: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextSnippetInput {
    pub name: String,
    pub body: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManualRevenueRow {
    pub id: String,
    pub workspace_id: String,
    pub year: i32,
    pub month: i32,
    pub amount: f64,
    pub currency: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManualRevenueInput {
    pub year: i32,
    pub month: i32,
    pub amount: f64,
    #[serde(default)]
    pub currency: String,
    #[serde(default)]
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportHistoryRow {
    pub id: String,
    pub workspace_id: String,
    pub source_type: String,
    pub module: String,
    pub file_name: Option<String>,
    pub record_count: i64,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginRow {
    pub id: String,
    pub workspace_id: String,
    pub manifest_json: String,
    pub enabled: bool,
}

// --- Bons de commande (même logique métier que les devis) ---

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderLineRow {
    pub id: String,
    pub purchase_order_id: String,
    pub article_id: Option<String>,
    pub description: String,
    pub options_snapshot_json: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub tax_rate: f64,
    pub line_subtotal: f64,
    pub line_tax: f64,
    pub line_total: f64,
    pub sort_order: i64,
    pub line_note: Option<String>,
    pub show_note_on_purchase_order: bool,
    pub billing_mode: String,
    #[serde(default = "default_discount_kind_str")]
    pub line_discount_kind: String,
    #[serde(default)]
    pub line_discount_value: f64,
    pub line_discount_label: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderComplementRow {
    pub id: String,
    pub purchase_order_id: String,
    pub sort_order: i64,
    pub snippet_id: Option<String>,
    pub body: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderRow {
    pub id: String,
    pub workspace_id: String,
    pub client_id: Option<String>,
    pub number: String,
    pub title: String,
    pub use_custom_number: bool,
    pub status: String,
    pub currency: String,
    pub tax_exempt: bool,
    pub issue_date: String,
    pub valid_until: Option<String>,
    pub subtotal: f64,
    pub tax_total: f64,
    pub total: f64,
    #[serde(default = "default_discount_kind_str")]
    pub discount_kind: String,
    #[serde(default)]
    pub discount_value: f64,
    pub discount_label: Option<String>,
    pub notes: Option<String>,
    #[serde(default)]
    pub pdf_template_variant: Option<String>,
    #[serde(default)]
    pub archived: bool,
    #[serde(default)]
    pub project_id: Option<String>,
    pub lines: Vec<PurchaseOrderLineRow>,
    pub complements: Vec<PurchaseOrderComplementRow>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderLineInput {
    pub id: Option<String>,
    pub article_id: Option<String>,
    pub description: String,
    #[serde(default)]
    pub options_snapshot_json: serde_json::Value,
    pub quantity: f64,
    pub unit_price: f64,
    pub tax_rate: f64,
    #[serde(default)]
    pub line_note: Option<String>,
    #[serde(default)]
    pub show_note_on_purchase_order: bool,
    #[serde(default)]
    pub billing_mode: String,
    #[serde(default)]
    pub line_discount_kind: Option<String>,
    #[serde(default)]
    pub line_discount_value: Option<f64>,
    #[serde(default)]
    pub line_discount_label: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderComplementInput {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub snippet_id: Option<String>,
    #[serde(default)]
    pub body: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderInput {
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub use_custom_number: bool,
    #[serde(default)]
    pub custom_number: Option<String>,
    pub client_id: Option<String>,
    pub status: String,
    pub currency: String,
    pub tax_exempt: bool,
    pub issue_date: String,
    pub valid_until: Option<String>,
    pub notes: Option<String>,
    #[serde(default)]
    pub pdf_template_variant: Option<String>,
    pub lines: Vec<PurchaseOrderLineInput>,
    #[serde(default)]
    pub complements: Vec<PurchaseOrderComplementInput>,
    #[serde(default)]
    pub archived: bool,
    #[serde(default)]
    pub discount_kind: Option<String>,
    #[serde(default)]
    pub discount_value: Option<f64>,
    #[serde(default)]
    pub discount_label: Option<String>,
    #[serde(default)]
    pub project_id: Option<String>,
}

