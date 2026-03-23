const MODIFIER_KEYS = new Set([
  "Meta",
  "Control",
  "Alt",
  "Shift",
  "CapsLock",
]);

const KEY_MAP: Record<string, string> = {
  " ": "Space",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
};

/**
 * Convert a KeyboardEvent into a Tauri-compatible shortcut string.
 * Returns null if no non-modifier key is pressed.
 */
export function keyEventToShortcutString(e: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(e.key)) return null;

  const parts: string[] = [];

  if (e.metaKey || e.ctrlKey) parts.push("CmdOrCtrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");

  const key = KEY_MAP[e.key] ?? e.key.toUpperCase();
  parts.push(key);

  if (parts.length < 2) return null; // Require at least one modifier

  return parts.join("+");
}

/**
 * Format a Tauri shortcut string for display.
 * Converts "CmdOrCtrl" to platform-appropriate symbol.
 */
export function formatShortcutForDisplay(shortcut: string): string {
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.includes("Mac");

  return shortcut
    .replace(/CmdOrCtrl/g, isMac ? "\u2318" : "Ctrl")
    .replace(/Shift/g, isMac ? "\u21E7" : "Shift")
    .replace(/Alt/g, isMac ? "\u2325" : "Alt")
    .replace(/\+/g, "");
}
