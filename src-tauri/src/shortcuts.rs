use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "shortcuts.json";
const STORE_KEY: &str = "shortcuts";

// Using Alt modifier to avoid conflicts with common shortcuts on Windows
// (Ctrl+Shift+C is often used by screenshot tools, DevTools, etc.)
const DEFAULT_SAVE_CLIP: &str = "CmdOrCtrl+Alt+C";
const DEFAULT_SHOW_HISTORY: &str = "CmdOrCtrl+Alt+V";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortcutConfig {
    pub save_clip: String,
    pub show_history: String,
}

impl Default for ShortcutConfig {
    fn default() -> Self {
        Self {
            save_clip: DEFAULT_SAVE_CLIP.to_string(),
            show_history: DEFAULT_SHOW_HISTORY.to_string(),
        }
    }
}

fn load_config(app: &tauri::AppHandle) -> ShortcutConfig {
    let store = match app.store(STORE_FILE) {
        Ok(s) => s,
        Err(_) => return ShortcutConfig::default(),
    };

    store
        .get(STORE_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default()
}

fn save_config(app: &tauri::AppHandle, config: &ShortcutConfig) -> Result<(), String> {
    let store = app.store(STORE_FILE).map_err(|e| format!("Failed to open store: {e}"))?;
    let value = serde_json::to_value(config).map_err(|e| format!("Failed to serialize: {e}"))?;
    store.set(STORE_KEY, value);
    store.save().map_err(|e| format!("Failed to save store: {e}"))?;
    Ok(())
}

fn validate_shortcut(s: &str) -> Result<Shortcut, String> {
    s.parse::<Shortcut>()
        .map_err(|e| format!("Invalid shortcut \"{s}\": {e}"))
}

fn register_shortcuts_inner(
    app: &tauri::AppHandle,
    config: &ShortcutConfig,
) -> Result<(), String> {
    let save_shortcut = validate_shortcut(&config.save_clip)?;
    let show_shortcut = validate_shortcut(&config.show_history)?;

    app.global_shortcut()
        .on_shortcuts(
            [save_shortcut, show_shortcut],
            move |app_handle, shortcut, event| {
                if event.state != ShortcutState::Pressed {
                    return;
                }
                if shortcut == &save_shortcut {
                    let _ = app_handle.emit("save-clip", ());
                } else if shortcut == &show_shortcut {
                    let _ = app_handle.emit("show-history", ());
                }
            },
        )
        .map_err(|e| format!("Failed to register shortcuts: {e}"))
}

fn unregister_all(app: &tauri::AppHandle) -> Result<(), String> {
    app.global_shortcut()
        .unregister_all()
        .map_err(|e| format!("Failed to unregister shortcuts: {e}"))
}

/// Called during app setup to load and register shortcuts.
/// On Windows, global shortcuts may conflict with other apps.
/// We log errors but don't crash the app - users can change shortcuts in settings.
pub fn init(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let config = load_config(app.handle());

    // Try to register shortcuts, but don't crash if they fail (common on Windows)
    match register_shortcuts_inner(app.handle(), &config) {
        Ok(()) => {
            log::info!(
                "Shortcuts registered: save={}, history={}",
                config.save_clip,
                config.show_history
            );
        }
        Err(e) => {
            log::warn!(
                "Failed to register shortcuts ({}). Another app may be using these keys. \
                 You can change shortcuts in Settings (gear icon).",
                e
            );
            // Emit event so frontend can show a warning
            let _ = app.handle().emit("shortcut-registration-failed", e.clone());
        }
    }

    // Register Cmd+, (settings shortcut) - separate so it can succeed even if others fail
    let settings_shortcut: Shortcut = "CmdOrCtrl+,".parse()?;
    if let Err(e) = app.global_shortcut().on_shortcut(
        settings_shortcut,
        move |app_handle, _shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }
            let _ = app_handle.emit("open-settings", ());
        },
    ) {
        log::warn!("Failed to register settings shortcut (Cmd+,): {}", e);
    }

    Ok(())
}

#[tauri::command]
pub fn get_shortcuts(app: tauri::AppHandle) -> Result<ShortcutConfig, String> {
    Ok(load_config(&app))
}

#[tauri::command]
pub fn update_shortcut(
    app: tauri::AppHandle,
    action: String,
    shortcut: String,
) -> Result<ShortcutConfig, String> {
    // Validate the shortcut string parses
    validate_shortcut(&shortcut)?;

    let mut config = load_config(&app);

    // Check for conflicts
    match action.as_str() {
        "save_clip" => {
            if shortcut == config.show_history {
                return Err("This shortcut is already used for Show History".to_string());
            }
            config.save_clip = shortcut;
        }
        "show_history" => {
            if shortcut == config.save_clip {
                return Err("This shortcut is already used for Save Clip".to_string());
            }
            config.show_history = shortcut;
        }
        _ => return Err(format!("Unknown action: {action}")),
    }

    // Unregister old, register new
    unregister_all(&app)?;
    register_shortcuts_inner(&app, &config)?;

    // Re-register settings shortcut (Cmd+,)
    let settings_shortcut: Shortcut = "CmdOrCtrl+,"
        .parse()
        .map_err(|e| format!("Failed to parse settings shortcut: {e}"))?;
    app.global_shortcut()
        .on_shortcut(settings_shortcut, move |app_handle, _shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }
            let _ = app_handle.emit("open-settings", ());
        })
        .map_err(|e| format!("Failed to register settings shortcut: {e}"))?;

    // Persist
    save_config(&app, &config)?;

    log::info!(
        "Shortcut updated: {} = {}",
        action,
        match action.as_str() {
            "save_clip" => &config.save_clip,
            "show_history" => &config.show_history,
            _ => "?",
        }
    );

    Ok(config)
}

#[tauri::command]
pub fn reset_shortcuts(app: tauri::AppHandle) -> Result<ShortcutConfig, String> {
    let config = ShortcutConfig::default();

    unregister_all(&app)?;
    register_shortcuts_inner(&app, &config)?;

    // Re-register settings shortcut
    let settings_shortcut: Shortcut = "CmdOrCtrl+,"
        .parse()
        .map_err(|e| format!("Failed to parse settings shortcut: {e}"))?;
    app.global_shortcut()
        .on_shortcut(settings_shortcut, move |app_handle, _shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }
            let _ = app_handle.emit("open-settings", ());
        })
        .map_err(|e| format!("Failed to register settings shortcut: {e}"))?;

    save_config(&app, &config)?;

    log::info!("Shortcuts reset to defaults");
    Ok(config)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = ShortcutConfig::default();
        assert_eq!(config.save_clip, "CmdOrCtrl+Alt+C");
        assert_eq!(config.show_history, "CmdOrCtrl+Alt+V");
    }

    #[test]
    fn test_config_serialization_roundtrip() {
        let config = ShortcutConfig {
            save_clip: "CmdOrCtrl+Shift+K".to_string(),
            show_history: "CmdOrCtrl+Shift+L".to_string(),
        };
        let json = serde_json::to_string(&config).unwrap();
        let restored: ShortcutConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(restored.save_clip, config.save_clip);
        assert_eq!(restored.show_history, config.show_history);
    }

    #[test]
    fn test_validate_shortcut_valid() {
        assert!(validate_shortcut("CmdOrCtrl+Shift+C").is_ok());
        assert!(validate_shortcut("CmdOrCtrl+K").is_ok());
        assert!(validate_shortcut("Alt+Shift+V").is_ok());
    }

    #[test]
    fn test_validate_shortcut_invalid() {
        assert!(validate_shortcut("").is_err());
        assert!(validate_shortcut("NotAKey").is_err());
    }
}
