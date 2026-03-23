import { useCallback, useEffect, useState } from "react";
import type { Clip } from "../lib/types";

interface HistoryPickerProps {
  readonly clips: readonly Clip[];
  readonly onSelect: (clip: Clip) => void;
  readonly onDismiss: () => void;
}

export function HistoryPicker({ clips, onSelect, onDismiss }: HistoryPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || (e.key === "v" && (e.metaKey || e.ctrlKey) && e.shiftKey)) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % clips.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + clips.length) % clips.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (clips[selectedIndex]) {
          onSelect(clips[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    },
    [clips, selectedIndex, onSelect, onDismiss],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (clips.length === 0) return null;

  return (
    <div className="history-overlay" onClick={onDismiss}>
      <div className="history-picker" onClick={(e) => e.stopPropagation()}>
        <div className="history-picker-header">Clipboard History</div>
        {clips.map((clip, index) => (
          <div
            key={clip.id}
            className={`history-item${index === selectedIndex ? " selected" : ""}`}
            onClick={() => onSelect(clip)}
          >
            <div className="history-item-text">{clip.content}</div>
            <div className="history-item-meta">{clip.device_name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
