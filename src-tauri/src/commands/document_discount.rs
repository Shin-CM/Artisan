//! Remise globale document : HT puis TVA au prorata (plusieurs taux).

pub fn normalize_discount_kind(raw: Option<&str>) -> &'static str {
    match raw.map(str::trim).filter(|s| !s.is_empty()) {
        Some("percent") => "percent",
        Some("fixed") => "fixed",
        _ => "none",
    }
}

/// `gross_subtotal` / `gross_tax` = sommes des lignes avant remise.
/// Retourne `(net_ht, net_tax, net_ttc)` persistés sur le document.
pub fn apply_document_discount(
    gross_subtotal: f64,
    gross_tax: f64,
    tax_exempt: bool,
    kind: &str,
    value: f64,
) -> (f64, f64, f64) {
    let gross_total = gross_subtotal + gross_tax;
    if kind == "none" || !value.is_finite() || value <= 0.0 {
        return (gross_subtotal, gross_tax, gross_total);
    }
    let net_ht = match kind {
        "percent" => {
            let p = value.clamp(0.0, 100.0);
            gross_subtotal * (1.0 - p / 100.0)
        }
        "fixed" => (gross_subtotal - value).max(0.0),
        _ => gross_subtotal,
    };
    let net_tax = if tax_exempt {
        0.0
    } else if gross_subtotal > 0.0 {
        gross_tax * (net_ht / gross_subtotal)
    } else {
        0.0
    };
    (net_ht, net_tax, net_ht + net_tax)
}

/// Remise sur le HT d’une ligne (pourcentage ou fixe), avant TVA ligne.
pub fn apply_line_discount_ht(gross_ht: f64, kind: &str, value: f64) -> f64 {
    if kind == "none" || !value.is_finite() || value <= 0.0 {
        return gross_ht;
    }
    match kind {
        "percent" => {
            let p = value.clamp(0.0, 100.0);
            gross_ht * (1.0 - p / 100.0)
        }
        "fixed" => (gross_ht - value).max(0.0),
        _ => gross_ht,
    }
}

/// Pour appliquer une remise ligne depuis l’input JSON (`kind` + `value`).
pub fn line_discount_tuple_for_apply(
    kind: Option<&str>,
    value: Option<f64>,
) -> (&'static str, f64) {
    let k = normalize_discount_kind(kind);
    let val_raw = value.unwrap_or(0.0);
    let val = if val_raw.is_finite() {
        val_raw.max(0.0)
    } else {
        0.0
    };
    if k == "none" || val <= 0.0 {
        ("none", 0.0)
    } else {
        (k, val)
    }
}

/// Valeurs normalisées à persister en base pour une remise ligne.
pub fn line_discount_triple_for_db(
    kind_opt: Option<&str>,
    value_opt: Option<f64>,
    label_opt: Option<&str>,
) -> (String, f64, Option<String>) {
    let (k, v) = line_discount_tuple_for_apply(kind_opt, value_opt);
    let kind = k.to_string();
    let value = if k == "none" { 0.0 } else { v };
    let label = label_opt
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string);
    (kind, value, label)
}
