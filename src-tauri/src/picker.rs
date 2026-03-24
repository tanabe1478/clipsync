use std::sync::Mutex;
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_clipboard_manager::ClipboardExt;

const PICKER_LABEL: &str = "picker";
const PICKER_WIDTH: f64 = 500.0;
const PICKER_HEIGHT: f64 = 460.0;

/// Stores the PID of the app that was active before the picker was shown.
static PREVIOUS_APP_PID: Mutex<Option<i32>> = Mutex::new(None);

/// Save the currently focused app's PID before showing the picker.
#[cfg(target_os = "macos")]
fn save_frontmost_app() {
    use objc2_app_kit::NSWorkspace;

    let workspace = NSWorkspace::sharedWorkspace();
    if let Some(app) = workspace.frontmostApplication() {
        let pid = app.processIdentifier();
        if let Ok(mut prev) = PREVIOUS_APP_PID.lock() {
            *prev = Some(pid);
            log::info!("Saved frontmost app PID: {pid}");
        }
    }
}

/// Activate the previously saved app by PID.
#[cfg(target_os = "macos")]
fn activate_previous_app() {
    use objc2_app_kit::NSRunningApplication;

    let pid = match PREVIOUS_APP_PID.lock() {
        Ok(prev) => *prev,
        Err(_) => None,
    };

    if let Some(pid) = pid {
        if let Some(app) = NSRunningApplication::runningApplicationWithProcessIdentifier(pid) {
            #[allow(deprecated)]
            app.activateWithOptions(
                objc2_app_kit::NSApplicationActivationOptions::ActivateIgnoringOtherApps,
            );
            log::info!("Activated previous app PID: {pid}");
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn save_frontmost_app() {}

#[cfg(not(target_os = "macos"))]
fn activate_previous_app() {}

/// Show the picker window (create lazily on first use).
pub fn show_picker(app: &tauri::AppHandle) -> Result<(), String> {
    // Remember the currently active app BEFORE showing picker
    save_frontmost_app();

    if let Some(window) = app.get_webview_window(PICKER_LABEL) {
        window.center().map_err(|e| format!("center failed: {e}"))?;
        window.show().map_err(|e| format!("show failed: {e}"))?;
        window
            .set_focus()
            .map_err(|e| format!("focus failed: {e}"))?;
        let _ = app.emit_to(PICKER_LABEL, "picker-shown", ());
    } else {
        let window = WebviewWindowBuilder::new(
            app,
            PICKER_LABEL,
            WebviewUrl::App("/picker.html".into()),
        )
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

    // 3. Activate previous app, then simulate paste
    std::thread::spawn(move || {
        // Activate the app that was focused before the picker opened
        activate_previous_app();

        // Give macOS time to complete the app switch
        std::thread::sleep(std::time::Duration::from_millis(150));

        log::info!("Attempting paste simulation...");
        match simulate_paste() {
            Ok(()) => log::info!("Paste simulation completed"),
            Err(e) => log::error!("simulate_paste failed: {e}"),
        }
    });

    Ok(())
}

/// Simulate Cmd+V (macOS) or Ctrl+V (Windows) using platform-native APIs.
fn simulate_paste() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        simulate_paste_macos()
    }

    #[cfg(target_os = "windows")]
    {
        simulate_paste_windows()
    }

    #[cfg(target_os = "linux")]
    {
        simulate_paste_linux()
    }
}

#[cfg(target_os = "macos")]
fn simulate_paste_macos() -> Result<(), String> {
    use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation, CGKeyCode};
    use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

    const V_KEY: CGKeyCode = 9;

    let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState)
        .map_err(|_| "Failed to create CGEventSource".to_string())?;

    let key_down = CGEvent::new_keyboard_event(source.clone(), V_KEY, true)
        .map_err(|_| "Failed to create key down event".to_string())?;
    key_down.set_flags(CGEventFlags::CGEventFlagCommand);

    let key_up = CGEvent::new_keyboard_event(source, V_KEY, false)
        .map_err(|_| "Failed to create key up event".to_string())?;
    key_up.set_flags(CGEventFlags::CGEventFlagCommand);

    key_down.post(CGEventTapLocation::HID);
    key_up.post(CGEventTapLocation::HID);

    Ok(())
}

#[cfg(target_os = "windows")]
fn simulate_paste_windows() -> Result<(), String> {
    use enigo::{Direction, Enigo, Key, Keyboard, Settings};

    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("enigo init failed: {e}"))?;

    enigo
        .key(Key::Control, Direction::Press)
        .map_err(|e| format!("key press failed: {e}"))?;
    enigo
        .key(Key::Unicode('v'), Direction::Click)
        .map_err(|e| format!("key click failed: {e}"))?;
    enigo
        .key(Key::Control, Direction::Release)
        .map_err(|e| format!("key release failed: {e}"))?;

    Ok(())
}

#[cfg(target_os = "linux")]
fn simulate_paste_linux() -> Result<(), String> {
    use enigo::{Direction, Enigo, Key, Keyboard, Settings};

    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("enigo init failed: {e}"))?;

    enigo
        .key(Key::Control, Direction::Press)
        .map_err(|e| format!("key press failed: {e}"))?;
    enigo
        .key(Key::Unicode('v'), Direction::Click)
        .map_err(|e| format!("key click failed: {e}"))?;
    enigo
        .key(Key::Control, Direction::Release)
        .map_err(|e| format!("key release failed: {e}"))?;

    Ok(())
}
