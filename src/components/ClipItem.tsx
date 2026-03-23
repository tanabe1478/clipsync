import type { Clip } from "../lib/types";

interface ClipItemProps {
  readonly clip: Clip;
  readonly onCopy: (clip: Clip) => void;
  readonly onTogglePin: (clipId: string) => void;
  readonly onDelete: (clipId: string) => void;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString();
}

export function ClipItem({ clip, onCopy, onTogglePin, onDelete }: ClipItemProps) {
  return (
    <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", gap: 8 }}>
      <div
        style={{ flex: 1, cursor: "pointer", overflow: "hidden" }}
        onClick={() => onCopy(clip)}
      >
        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "monospace" }}>
          {clip.content}
        </div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
          {clip.device_name} · {formatTime(clip.created_at)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
        <button
          onClick={() => onTogglePin(clip.id)}
          aria-label={clip.pinned ? "Unpin" : "Pin"}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
        >
          {clip.pinned ? "\u{1F4CC}" : "\u{1F4CB}"}
        </button>
        <button
          onClick={() => onDelete(clip.id)}
          aria-label="Delete"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
        >
          {"\u{1F5D1}"}
        </button>
      </div>
    </div>
  );
}
