use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectRow {
    pub id: String,
    pub workspace_id: String,
    pub client_id: Option<String>,
    pub code: Option<String>,
    pub name: String,
    pub status: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub budget_estimate: Option<f64>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectInput {
    pub client_id: Option<String>,
    #[serde(default)]
    pub code: Option<String>,
    pub name: String,
    pub status: String,
    #[serde(default)]
    pub start_date: Option<String>,
    #[serde(default)]
    pub end_date: Option<String>,
    #[serde(default)]
    pub budget_estimate: Option<f64>,
    #[serde(default)]
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectDocumentRow {
    pub document_kind: String,
    pub id: String,
    pub number: String,
    pub status: String,
    pub total: f64,
    pub archived: bool,
    pub issue_date: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectLinkCounts {
    pub quotes: i64,
    pub invoices: i64,
    pub credit_notes: i64,
    pub purchase_orders: i64,
    pub crm_opportunities: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectFinancialSummary {
    pub budget_estimate: Option<f64>,
    /// Total TTC factures classiques (non archivées).
    pub invoiced_total: f64,
    /// Total TTC des avoirs liés (non archivés), montants tels qu’en base.
    pub credit_notes_total: f64,
    /// Total TTC devis acceptés (non archivés).
    pub quotes_accepted_total: f64,
    /// Total TTC bons de commande (non archivés).
    pub purchase_orders_total: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectTimeEntryRow {
    pub id: String,
    pub workspace_id: String,
    pub project_id: String,
    pub work_date: String,
    pub duration_minutes: i64,
    pub description: Option<String>,
    pub billable: bool,
    pub invoice_line_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    /// Renseigné en liste / après création si `invoice_line_id` est lié.
    #[serde(default)]
    pub invoice_number: Option<String>,
    /// Ex. description de ligne (aperçu).
    #[serde(default)]
    pub invoice_line_label: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectTimeInvoiceSummary {
    pub id: String,
    pub number: String,
    pub issue_date: String,
    pub status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectTimeInvoiceLineOption {
    pub id: String,
    pub description: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StockLevelRow {
    pub article_id: String,
    pub article_name: String,
    pub quantity: f64,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StockMovementRow {
    pub id: String,
    pub article_id: String,
    pub article_name: String,
    pub movement_kind: String,
    pub quantity_delta: f64,
    pub label: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StockMovementInput {
    pub article_id: String,
    /// `in` | `out` | `adjustment` (delta signé).
    pub movement_kind: String,
    pub quantity: f64,
    #[serde(default)]
    pub label: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StockArticleSettingRow {
    pub article_id: String,
    pub article_name: String,
    pub track_stock: bool,
    pub min_quantity: Option<f64>,
    pub reorder_quantity: Option<f64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StockArticleSettingInput {
    pub article_id: String,
    pub track_stock: bool,
    pub min_quantity: Option<f64>,
    pub reorder_quantity: Option<f64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StockLowAlertRow {
    pub article_id: String,
    pub article_name: String,
    pub quantity: f64,
    pub min_quantity: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectTimeEntryInput {
    pub work_date: String,
    pub duration_minutes: i64,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default = "default_true")]
    pub billable: bool,
    #[serde(default)]
    pub invoice_line_id: Option<String>,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectImportRecord {
    pub id: String,
    pub client_id: Option<String>,
    pub code: Option<String>,
    pub name: String,
    pub status: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub budget_estimate: Option<f64>,
    pub notes: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
