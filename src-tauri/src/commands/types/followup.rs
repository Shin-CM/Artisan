use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrmOpportunityRow {
    pub id: String,
    pub workspace_id: String,
    pub client_id: Option<String>,
    pub quote_id: Option<String>,
    #[serde(default)]
    pub project_id: Option<String>,
    pub title: String,
    pub stage: String,
    pub amount_estimate: Option<f64>,
    pub next_action: Option<String>,
    pub notes: Option<String>,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrmOpportunityInput {
    #[serde(default)]
    pub title: Option<String>,
    pub client_id: Option<String>,
    pub quote_id: Option<String>,
    #[serde(default)]
    pub project_id: Option<String>,
    pub stage: String,
    #[serde(default)]
    pub amount_estimate: Option<f64>,
    #[serde(default)]
    pub next_action: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub sort_order: Option<i64>,
}

// --- Suivi client / relance ---

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FollowupWeights {
    #[serde(default = "default_weight_delay")]
    pub delay: f64,
    #[serde(default = "default_weight_value")]
    pub value: f64,
    #[serde(default = "default_weight_regularity")]
    pub regularity: f64,
    #[serde(default = "default_weight_tenure")]
    pub tenure: f64,
}

fn default_weight_delay() -> f64 {
    0.35
}
fn default_weight_value() -> f64 {
    0.25
}
fn default_weight_regularity() -> f64 {
    0.2
}
fn default_weight_tenure() -> f64 {
    0.2
}

impl Default for FollowupWeights {
    fn default() -> Self {
        Self {
            delay: default_weight_delay(),
            value: default_weight_value(),
            regularity: default_weight_regularity(),
            tenure: default_weight_tenure(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FollowupScoringSettings {
    #[serde(default = "default_period_multiplier")]
    pub period_multiplier: f64,
    #[serde(default = "default_min_invoices_for_period")]
    pub min_invoices_for_period: u32,
    #[serde(default = "default_value_months")]
    pub value_months: u32,
    #[serde(default)]
    pub weights: FollowupWeights,
    /// Jours pour estimer la périodicité (factures dans cette fenêtre).
    #[serde(default = "default_period_lookback_days")]
    pub period_lookback_days: u32,
}

fn default_period_multiplier() -> f64 {
    1.5
}
fn default_min_invoices_for_period() -> u32 {
    3
}
fn default_value_months() -> u32 {
    12
}
fn default_period_lookback_days() -> u32 {
    730
}

impl Default for FollowupScoringSettings {
    fn default() -> Self {
        Self {
            period_multiplier: default_period_multiplier(),
            min_invoices_for_period: default_min_invoices_for_period(),
            value_months: default_value_months(),
            weights: FollowupWeights::default(),
            period_lookback_days: default_period_lookback_days(),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListClientsFollowupInput {
    #[serde(default)]
    pub search: Option<String>,
    #[serde(default)]
    pub priority_level: Option<String>,
    #[serde(default)]
    pub tag_id: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ClientTagBrief {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientFollowupRow {
    pub client_id: String,
    pub client_name: String,
    pub score: i32,
    pub priority_level: String,
    pub days_since_last_touch: i64,
    pub last_touch_at: Option<String>,
    pub last_quote_at: Option<String>,
    pub last_invoice_at: Option<String>,
    pub last_contact_event_at: Option<String>,
    pub expected_period_days: Option<f64>,
    pub revenue_value_period: f64,
    pub invoice_count_in_period: i64,
    pub tags: Vec<ClientTagBrief>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientContactEventRow {
    pub id: String,
    pub workspace_id: String,
    pub client_id: String,
    pub kind: String,
    pub body: Option<String>,
    pub occurred_at: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientContactEventInput {
    pub kind: String,
    #[serde(default)]
    pub body: Option<String>,
    pub occurred_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientReminderRow {
    pub id: String,
    pub workspace_id: String,
    pub client_id: Option<String>,
    pub title: String,
    pub note: Option<String>,
    pub due_at: String,
    pub status: String,
    pub recurrence_rule: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientReminderInput {
    #[serde(default)]
    pub client_id: Option<String>,
    pub title: String,
    #[serde(default)]
    pub note: Option<String>,
    pub due_at: String,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub recurrence_rule: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientTagRow {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub color: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientTagInput {
    pub name: String,
    #[serde(default)]
    pub color: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientTimelineEntry {
    pub kind: String,
    pub id: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub occurred_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEventRow {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub note: Option<String>,
    pub start_date: String,
    pub end_date: String,
    pub color_key: Option<String>,
    pub color_hex: Option<String>,
    pub client_id: Option<String>,
    pub project_id: Option<String>,
    pub invoice_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEventInput {
    pub title: String,
    #[serde(default)]
    pub note: Option<String>,
    pub start_date: String,
    pub end_date: String,
    #[serde(default)]
    pub color_key: Option<String>,
    #[serde(default)]
    pub color_hex: Option<String>,
    #[serde(default)]
    pub client_id: Option<String>,
    #[serde(default)]
    pub project_id: Option<String>,
    #[serde(default)]
    pub invoice_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryActionRow {
    pub id: String,
    pub workspace_id: String,
    pub invoice_id: Option<String>,
    pub kind: String,
    pub status: String,
    pub due_at: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryActionInput {
    #[serde(default)]
    pub invoice_id: Option<String>,
    #[serde(default)]
    pub kind: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    pub due_at: String,
    #[serde(default)]
    pub notes: Option<String>,
}
