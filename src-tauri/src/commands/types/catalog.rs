use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceRow {
    pub id: String,
    pub name: String,
    pub entity_type: String,
    pub country_code: String,
    pub profile_json: String,
    pub base_currency: String,
    pub theme: String,
    pub pdf_output_dir: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceInput {
    pub name: String,
    #[serde(default = "default_entity")]
    pub entity_type: String,
    #[serde(default = "default_country")]
    pub country_code: String,
    #[serde(default)]
    pub profile_json: serde_json::Value,
    #[serde(default = "default_currency")]
    pub base_currency: String,
    #[serde(default)]
    pub pdf_output_dir: Option<String>,
}

fn default_entity() -> String {
    "company".into()
}
fn default_country() -> String {
    "FR".into()
}
fn default_currency() -> String {
    "EUR".into()
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientRow {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address_json: Option<String>,
    pub notes: Option<String>,
    pub details_json: Option<String>,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientInput {
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address_json: Option<serde_json::Value>,
    pub notes: Option<String>,
    #[serde(default)]
    pub details_json: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryRow {
    pub id: String,
    pub workspace_id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub sort_order: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArticleRow {
    pub id: String,
    pub workspace_id: String,
    pub category_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub base_price: f64,
    pub production_cost: Option<f64>,
    pub options_json: String,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
    pub flat_price: Option<f64>,
    pub hourly_rate: Option<f64>,
    pub supplier_name: Option<String>,
    pub supplier_reference: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArticleReorderItem {
    pub id: String,
    pub category_id: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArticleInput {
    pub name: String,
    pub description: Option<String>,
    pub category_id: Option<String>,
    pub base_price: f64,
    pub production_cost: Option<f64>,
    #[serde(default)]
    pub flat_price: Option<f64>,
    #[serde(default)]
    pub hourly_rate: Option<f64>,
    #[serde(default)]
    pub options_json: serde_json::Value,
    #[serde(default)]
    pub sort_order: Option<i64>,
    #[serde(default)]
    pub supplier_name: Option<String>,
    #[serde(default)]
    pub supplier_reference: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaxRateRow {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub rate: f64,
    pub is_default: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaxRateInput {
    pub name: String,
    pub rate: f64,
}
