#![deny(clippy::all)]

mod commands;

use commands::{get_device_name, read_clipboard, write_clipboard};
use tauri::Emitter;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

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
            }

            register_hotkeys(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_device_name,
            read_clipboard,
            write_clipboard,
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
