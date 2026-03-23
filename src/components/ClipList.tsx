import type { Clip } from "../lib/types";
import { ClipItem } from "./ClipItem";

interface ClipListProps {
  readonly clips: readonly Clip[];
  readonly onCopy: (clip: Clip) => void;
  readonly onTogglePin: (clipId: string) => void;
  readonly onDelete: (clipId: string) => void;
}

export function ClipList({ clips, onCopy, onTogglePin, onDelete }: ClipListProps) {
  if (clips.length === 0) {
    return (
      <div className="clip-list-empty">
        <p>No clips yet</p>
        <p>
          Press <span className="shortcut">{"\u2318"}+Shift+C</span> to save a
          clip
        </p>
      </div>
    );
  }

  return (
    <div className="clip-list">
      {clips.map((clip) => (
        <ClipItem
          key={clip.id}
          clip={clip}
          onCopy={onCopy}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
