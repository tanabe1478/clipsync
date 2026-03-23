import { useCallback, useEffect, useState } from "react";
import {
  keyEventToShortcutString,
  formatShortcutForDisplay,
} from "../lib/shortcutKeys";

interface ShortcutRecorderProps {
  readonly label: string;
  readonly currentShortcut: string;
  readonly onRecord: (shortcut: string) => void;
}

export function ShortcutRecorder({
  label,
  currentShortcut,
  onRecord,
}: ShortcutRecorderProps) {
  const [recording, setRecording] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setRecording(false);
        return;
      }

      const shortcut = keyEventToShortcutString(e);
      if (shortcut) {
        onRecord(shortcut);
        setRecording(false);
      }
    },
    [onRecord],
  );

  useEffect(() => {
    if (!recording) return;
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [recording, handleKeyDown]);

  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <button
        className={`shortcut-recorder${recording ? " recording" : ""}`}
        onClick={() => setRecording(true)}
        aria-label={`Change shortcut for ${label}`}
      >
        {recording ? "Press keys..." : formatShortcutForDisplay(currentShortcut)}
      </button>
    </div>
  );
}
