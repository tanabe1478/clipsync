#![deny(clippy::all)]

mod auth_server;
mod commands;
mod shortcuts;

use commands::{get_device_name, log_from_frontend, read_clipboard, write_clipboard};
use shortcuts::{get_shortcuts, reset_shortcuts, update_shortcut};
use tauri::Emitter;
use tauri_plugin_deep_link::DeepLinkExt;

/// Returns the OAuth redirect URL based on build mode.
#[tauri::command]
fn get_auth_redirect_url() -> String {
    if cfg!(debug_assertions) {
        auth_server::redirect_url()
    } else {
        "clipsync://auth/callback".to_string()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;

                auth_server::start(app.handle().clone());
            }

            #[cfg(desktop)]
            if let Err(e) = app.deep_link().register("clipsync") {
                log::warn!("Deep link registration failed (expected in dev mode): {e}");
            }

            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                if let Some(url) = event.urls().first() {
                    let url_str = url.to_string();
                    log::info!("Deep link received: {}", url_str);
                    let _ = handle.emit("deep-link-auth", url_str);
                }
            });

            shortcuts::init(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_device_name,
            read_clipboard,
            write_clipboard,
            get_auth_redirect_url,
            log_from_frontend,
            get_shortcuts,
            update_shortcut,
            reset_shortcuts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
