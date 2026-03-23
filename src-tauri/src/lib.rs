#![deny(clippy::all)]

mod auth_server;
mod commands;

use commands::{get_device_name, read_clipboard, write_clipboard};
use tauri::Emitter;
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

/// Returns the OAuth redirect URL based on build mode.
/// Dev mode: localhost HTTP server. Release: custom URL scheme.
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
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;

                // Start local HTTP server for OAuth callback in dev mode
                auth_server::start(app.handle().clone());
            }

            // Register deep link scheme for OAuth callback (release mode only)
            #[cfg(desktop)]
            if let Err(e) = app.deep_link().register("clipsync") {
                log::warn!("Deep link registration failed (expected in dev mode): {e}");
            }

            // Listen for deep link events (OAuth callback) - release mode
            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                if let Some(url) = event.urls().first() {
                    let url_str = url.to_string();
                    log::info!("Deep link received: {}", url_str);
                    let _ = handle.emit("deep-link-auth", url_str);
                }
            });

            register_hotkeys(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_device_name,
            read_clipboard,
            write_clipboard,
            get_auth_redirect_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn register_hotkeys(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let save_shortcut: Shortcut = "CmdOrCtrl+Shift+C".parse()?;
    let paste_shortcut: Shortcut = "CmdOrCtrl+Shift+V".parse()?;

    app.global_shortcut().on_shortcuts(
        [save_shortcut, paste_shortcut],
        move |app_handle, shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }

            if shortcut == &save_shortcut {
                let _ = app_handle.emit("save-clip", ());
            } else if shortcut == &paste_shortcut {
                let _ = app_handle.emit("show-history", ());
            }
        },
    )?;

    Ok(())
}
