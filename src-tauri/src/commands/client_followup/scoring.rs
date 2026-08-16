use super::super::types::{FollowupScoringSettings, FollowupWeights};

pub(crate) const INVOICE_STATUSES_CA: &str = "('paid','partially_paid','partial','sent','issued')";

pub(crate) fn median_interval_days(dates: &[chrono::NaiveDate]) -> Option<f64> {
    if dates.len() < 2 {
        return None;
    }
    let mut intervals: Vec<f64> = dates
        .windows(2)
        .map(|w| (w[1].signed_duration_since(w[0]).num_days().abs() as f64))
        .collect();
    if intervals.is_empty() {
        return None;
    }
    intervals.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let mid = intervals.len() / 2;
    Some(intervals[mid])
}

fn interval_coefficient_of_variation(intervals: &[f64]) -> f64 {
    if intervals.len() < 2 {
        return 1.0;
    }
    let n = intervals.len() as f64;
    let mean = intervals.iter().sum::<f64>() / n;
    if mean < 1.0 {
        return 1.0;
    }
    let var = intervals.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / n;
    (var.sqrt() / mean).min(2.0)
}

fn normalize_weights(w: &FollowupWeights) -> (f64, f64, f64, f64) {
    let s = w.delay + w.value + w.regularity + w.tenure;
    if s <= 0.0 {
        return (0.25, 0.25, 0.25, 0.25);
    }
    (w.delay / s, w.value / s, w.regularity / s, w.tenure / s)
}

pub(crate) fn compute_followup_score(
    settings: &FollowupScoringSettings,
    days_since_last_touch: i64,
    expected_period_days: Option<f64>,
    revenue_period: f64,
    interval_days_sample: &[f64],
    tenure_days: i64,
) -> i32 {
    let (wd, wv, wr, wt) = normalize_weights(&settings.weights);

    let delay_component = if let Some(exp) = expected_period_days.filter(|e| *e >= 1.0) {
        let threshold = settings.period_multiplier * exp;
        if (days_since_last_touch as f64) <= threshold {
            0.0
        } else {
            let overdue = days_since_last_touch as f64 - threshold;
            ((overdue / exp.max(1.0)).min(4.0) / 4.0) * 100.0
        }
    } else {
        ((days_since_last_touch as f64 / 180.0).min(1.0)) * 85.0
    };

    let value_component = (revenue_period.ln_1p() / 50_000f64.ln_1p()).min(1.0) * 100.0;

    let regularity_component = if interval_days_sample.len() >= 2 {
        let cv = interval_coefficient_of_variation(interval_days_sample);
        (1.0 - cv / 2.0).max(0.0) * 100.0
    } else {
        45.0
    };

    let tenure_component = ((tenure_days as f64 / (3.0 * 365.0)).min(1.0)) * 100.0;

    let raw = wd * delay_component
        + wv * value_component
        + wr * regularity_component
        + wt * tenure_component;
    raw.round().clamp(0.0, 255.0) as i32
}

pub(crate) fn priority_level(score: i32) -> &'static str {
    if score >= 70 {
        "high"
    } else if score >= 40 {
        "medium"
    } else {
        "low"
    }
}
