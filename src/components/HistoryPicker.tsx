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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onDismiss}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: 360,
          maxHeight: 400,
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", fontWeight: "bold" }}>
          Clipboard History
        </div>
        {clips.map((clip, index) => (
          <div
            key={clip.id}
            onClick={() => onSelect(clip)}
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              background: index === selectedIndex ? "#e8f0fe" : "transparent",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "monospace", fontSize: 13 }}>
              {clip.content}
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              {clip.device_name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
