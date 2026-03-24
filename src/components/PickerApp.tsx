import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listen, emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import Fuse from "fuse.js";
import type { Clip } from "../lib/types";
import "../picker.css";

export function PickerApp() {
  const [clips, setClips] = useState<readonly Clip[]>([]);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Request clips from main window on mount and when picker is shown
  useEffect(() => {
    emit("request-clips");

    const unlistenClips = listen<Clip[]>("clips-for-picker", (event) => {
      setClips(event.payload);
      setQuery("");
      setSelectedIndex(0);
      inputRef.current?.focus();
    });

    const unlistenShown = listen("picker-shown", () => {
      emit("request-clips");
      setQuery("");
      setSelectedIndex(0);
      inputRef.current?.focus();
    });

    return () => {
      unlistenClips.then((fn) => fn());
      unlistenShown.then((fn) => fn());
    };
  }, []);

  // Fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(clips as Clip[], {
        keys: ["content", "device_name"],
        threshold: 0.4,
        includeScore: true,
      }),
    [clips],
  );

  const filteredClips = useMemo(() => {
    if (!query.trim()) return clips;
    return fuse.search(query).map((r) => r.item);
  }, [clips, query, fuse]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredClips.length]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    async (clip: Clip) => {
      try {
        await invoke("paste_from_picker", { text: clip.content });
      } catch (err) {
        // Fallback: just hide, clip is on clipboard
        await invoke("hide_picker_window");
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) =>
          filteredClips.length > 0 ? (i + 1) % filteredClips.length : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) =>
          filteredClips.length > 0
            ? (i - 1 + filteredClips.length) % filteredClips.length
            : 0,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredClips[selectedIndex]) {
          handleSelect(filteredClips[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        invoke("hide_picker_window");
      }
    },
    [filteredClips, selectedIndex, handleSelect],
  );

  return (
    <div className="picker-container" onKeyDown={handleKeyDown}>
      <div className="picker-search">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search clips..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="picker-results" ref={listRef}>
        {filteredClips.length === 0 ? (
          <div className="picker-empty">
            {clips.length === 0 ? "No clips" : "No matches"}
          </div>
        ) : (
          filteredClips.map((clip, index) => (
            <div
              key={clip.id}
              className={`picker-item${index === selectedIndex ? " selected" : ""}`}
              onClick={() => handleSelect(clip)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="picker-item-text">{clip.content}</div>
              <div className="picker-item-meta">{clip.device_name}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
