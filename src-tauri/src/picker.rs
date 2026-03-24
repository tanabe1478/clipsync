use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_clipboard_manager::ClipboardExt;

const PICKER_LABEL: &str = "picker";
const PICKER_WIDTH: f64 = 500.0;
const PICKER_HEIGHT: f64 = 460.0;

/// Show the picker window (create lazily on first use).
pub fn show_picker(app: &tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(PICKER_LABEL) {
        // Already exists — show, center, and focus
        window.center().map_err(|e| format!("center failed: {e}"))?;
        window.show().map_err(|e| format!("show failed: {e}"))?;
        window
            .set_focus()
            .map_err(|e| format!("focus failed: {e}"))?;
        let _ = app.emit_to(PICKER_LABEL, "picker-shown", ());
    } else {
        // Create new picker window
        let window = WebviewWindowBuilder::new(app, PICKER_LABEL, WebviewUrl::App("/picker.html".into()))
            .title("ClipSync Picker")
            .inner_size(PICKER_WIDTH, PICKER_HEIGHT)
            .always_on_top(true)
            .decorations(false)
            .resizable(false)
            .skip_taskbar(true)
            .center()
            .focused(true)
            .visible(true)
            .build()
            .map_err(|e| format!("Failed to create picker window: {e}"))?;

        // Auto-hide on focus loss
        let app_handle = app.clone();
        window.on_window_event(move |event| {
            if let tauri::WindowEvent::Focused(false) = event {
                if let Some(w) = app_handle.get_webview_window(PICKER_LABEL) {
                    let _ = w.hide();
                }
            }
        });
    }

    Ok(())
}

#[tauri::command]
pub fn hide_picker_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(PICKER_LABEL) {
        window.hide().map_err(|e| format!("hide failed: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
pub fn paste_from_picker(app: tauri::AppHandle, text: String) -> Result<(), String> {
    // 1. Write to clipboard
    app.clipboard()
        .write_text(&text)
        .map_err(|e| format!("clipboard write failed: {e}"))?;

    // 2. Hide picker window
    if let Some(window) = app.get_webview_window(PICKER_LABEL) {
        let _ = window.hide();
    }

    // 3. Wait for focus to return, then simulate paste
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(100));
        simulate_paste();
    });

    Ok(())
}

fn simulate_paste() {
    use enigo::{Direction, Enigo, Key, Keyboard, Settings};

    let mut enigo = match Enigo::new(&Settings::default()) {
        Ok(e) => e,
        Err(e) => {
            log::error!("Failed to create enigo instance: {e}");
            return;
        }
    };

    #[cfg(target_os = "macos")]
    let modifier = Key::Meta;

    #[cfg(target_os = "windows")]
    let modifier = Key::Control;

    #[cfg(target_os = "linux")]
    let modifier = Key::Control;

    let _ = enigo.key(modifier, Direction::Press);
    let _ = enigo.key(Key::Unicode('v'), Direction::Click);
    let _ = enigo.key(modifier, Direction::Release);
}
