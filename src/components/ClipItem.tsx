import type { Clip } from "../lib/types";

interface ClipItemProps {
  readonly clip: Clip;
  readonly onCopy: (clip: Clip) => void;
  readonly onTogglePin: (clipId: string) => void;
  readonly onDelete: (clipId: string) => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ClipItem({ clip, onCopy, onTogglePin, onDelete }: ClipItemProps) {
  return (
    <div className={`clip-item${clip.pinned ? " pinned" : ""}`}>
      <div className="clip-content" onClick={() => onCopy(clip)}>
        <div className="clip-text">{clip.content}</div>
        <div className="clip-meta">
          <span>{clip.device_name}</span>
          <span>{timeAgo(clip.created_at)}</span>
        </div>
      </div>
      <div className="clip-actions">
        <button
          className={`btn-ghost${clip.pinned ? " pinned" : ""}`}
          onClick={() => onTogglePin(clip.id)}
          aria-label={clip.pinned ? "Unpin" : "Pin"}
          title={clip.pinned ? "Unpin" : "Pin"}
        >
          {clip.pinned ? "\u{1F4CC}" : "\u{1F4CB}"}
        </button>
        <button
          className="btn-ghost danger"
          onClick={() => onDelete(clip.id)}
          aria-label="Delete"
          title="Delete"
        >
          \u{2715}
        </button>
      </div>
    </div>
  );
}
