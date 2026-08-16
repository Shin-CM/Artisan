mod codec;
mod commands;
mod dashboard;
mod db;
mod local_api;
mod migrations;
mod url_handler_apps;

use db::{open_and_migrate, AppDb};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenvy::dotenv();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let resolver = app.path();
            let dir = resolver.app_local_data_dir().map_err(|e| e.to_string())?;
            std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            let db_path = dir.join("invoicies.sqlite");
            let conn = open_and_migrate(&db_path).map_err(|e| e.to_string())?;
            let app_db = AppDb {
                conn: std::sync::Arc::new(std::sync::Mutex::new(conn)),
            };
            let (api_enabled, api_port) =
                local_api::read_api_settings(&app_db).map_err(|e| e.to_string())?;
            let jwt_secret =
                local_api::load_or_create_jwt_secret(&dir.join("local_api_jwt_secret.bin"))
                    .map_err(|e| e.to_string())?;
            let jwt_secret = std::sync::Arc::new(jwt_secret);
            let pairing =
                std::sync::Arc::new(std::sync::Mutex::new(std::collections::HashMap::new()));
            let shared = std::sync::Arc::new(local_api::LocalApiShared {
                db: app_db.clone(),
                pairing,
                jwt_secret,
            });
            let (api_tx, api_rx) = tokio::sync::watch::channel((api_enabled, api_port));
            let control = local_api::LocalApiControl {
                shared: shared.clone(),
                watch: api_tx,
            };
            app.manage(app_db);
            app.manage(control);
            local_api::spawn_server_loop(shared, api_rx);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            codec::data_export_string,
            codec::data_import_string,
            dashboard::get_dashboard_stats,
            dashboard::get_revenue_comparison,
            commands::list_workspaces,
            commands::create_workspace,
            commands::update_workspace,
            commands::get_workspace,
            commands::delete_workspace,
            commands::update_workspace_theme,
            commands::list_crm_opportunities,
            commands::create_crm_opportunity,
            commands::update_crm_opportunity,
            commands::delete_crm_opportunity,
            commands::get_followup_settings,
            commands::update_followup_settings,
            commands::list_clients_followup,
            commands::list_contact_events,
            commands::create_contact_event,
            commands::get_contact_event,
            commands::update_contact_event,
            commands::delete_contact_event,
            commands::list_client_tags,
            commands::create_client_tag,
            commands::delete_client_tag,
            commands::set_client_tags,
            commands::list_reminders,
            commands::create_reminder,
            commands::get_reminder,
            commands::update_reminder,
            commands::delete_reminder,
            commands::list_calendar_events,
            commands::create_calendar_event,
            commands::get_calendar_event,
            commands::update_calendar_event,
            commands::delete_calendar_event,
            commands::get_calendar_holiday_cache,
            commands::sync_open_holidays,
            commands::list_recovery_actions,
            commands::create_recovery_action,
            commands::get_recovery_action,
            commands::update_recovery_action,
            commands::delete_recovery_action,
            commands::get_client_timeline,
            commands::list_projects,
            commands::get_project,
            commands::create_project,
            commands::update_project,
            commands::delete_project,
            commands::list_project_documents,
            commands::count_project_links,
            commands::get_project_financial_summary,
            commands::import_projects_bundle,
            commands::list_project_time_entries,
            commands::create_project_time_entry,
            commands::update_project_time_entry,
            commands::delete_project_time_entry,
            commands::list_invoices_for_project_time,
            commands::list_invoice_lines_for_project_time,
            commands::list_stock_levels,
            commands::list_stock_movements,
            commands::create_stock_movement,
            commands::clear_article_stock,
            commands::list_stock_article_settings,
            commands::upsert_stock_article_setting,
            commands::list_stock_low_alerts,
            commands::list_clients,
            commands::create_client,
            commands::get_client,
            commands::update_client,
            commands::delete_client,
            commands::list_categories,
            commands::create_category,
            commands::update_category,
            commands::delete_category,
            commands::list_articles,
            commands::create_article,
            commands::get_article,
            commands::update_article,
            commands::delete_article,
            commands::reorder_articles,
            commands::reorder_categories,
            commands::reorder_clients,
            commands::list_tax_rates,
            commands::create_tax_rate,
            commands::delete_tax_rate,
            commands::list_discount_presets,
            commands::create_discount_preset,
            commands::update_discount_preset,
            commands::delete_discount_preset,
            commands::list_quotes,
            commands::peek_next_quote_number,
            commands::create_quote,
            commands::get_quote,
            commands::update_quote,
            commands::delete_quote,
            commands::convert_quote_to_invoice,
            commands::convert_purchase_order_to_invoice,
            commands::list_purchase_orders,
            commands::peek_next_purchase_order_number,
            commands::create_purchase_order,
            commands::get_purchase_order,
            commands::update_purchase_order,
            commands::delete_purchase_order,
            commands::convert_quote_to_purchase_order,
            commands::list_invoices,
            commands::list_credit_notes,
            commands::peek_next_invoice_number,
            commands::peek_next_credit_note_number,
            commands::create_invoice,
            commands::get_invoice,
            commands::update_invoice,
            commands::delete_invoice,
            commands::log_import_history,
            commands::list_import_history,
            commands::list_plugins,
            commands::register_plugin_manifest,
            commands::set_plugin_enabled,
            commands::read_font_file_base64,
            commands::pick_logo_file_path,
            commands::pick_pdf_font_file_path,
            commands::pick_pdf_font_folder_path,
            commands::pick_pdf_output_dir,
            commands::copy_workspace_logo_from_path,
            commands::import_workspace_pdf_font_from_path,
            commands::import_workspace_pdf_fonts_from_folder,
            commands::delete_workspace_pdf_fonts,
            commands::rename_workspace_pdf_font_folder,
            commands::move_workspace_pdf_fonts_to_folder,
            commands::read_workspace_asset_base64,
            commands::write_pdf_file,
            commands::write_pdf_preview_temp,
            commands::list_text_snippets,
            commands::create_text_snippet,
            commands::update_text_snippet,
            commands::delete_text_snippet,
            commands::list_manual_revenue_entries,
            commands::upsert_manual_revenue_entry,
            commands::delete_manual_revenue_entry,
            local_api::local_api_get_status,
            local_api::local_api_set_enabled,
            local_api::local_api_set_port,
            local_api::local_api_start_pairing,
            local_api::local_api_list_sessions,
            local_api::local_api_revoke_session,
            local_api::local_api_set_operator_password,
            url_handler_apps::list_url_handler_apps,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
