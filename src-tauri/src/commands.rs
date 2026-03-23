use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
pub fn get_device_name() -> String {
    hostname::get()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_else(|_| "Unknown".to_string())
}

#[tauri::command]
pub fn read_clipboard(app: tauri::AppHandle) -> Result<String, String> {
    app.clipboard()
        .read_text()
        .map_err(|e| format!("Failed to read clipboard: {e}"))
}

#[tauri::command]
pub fn write_clipboard(app: tauri::AppHandle, text: String) -> Result<(), String> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| format!("Failed to write clipboard: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_device_name_returns_non_empty() {
        let name = get_device_name();
        assert!(!name.is_empty(), "device name should not be empty");
    }
}
