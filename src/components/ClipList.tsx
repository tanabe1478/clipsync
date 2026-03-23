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
      <div style={{ padding: 24, textAlign: "center", color: "#888" }}>
        No clips yet. Use Cmd+Shift+C to save a clip.
      </div>
    );
  }

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
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
