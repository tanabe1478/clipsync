import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAuth } from "./hooks/useAuth";
import { useClips } from "./hooks/useClips";
import { useRealtimeClips } from "./hooks/useRealtimeClips";
import { AuthScreen } from "./components/AuthScreen";
import { ClipList } from "./components/ClipList";
import { HistoryPicker } from "./components/HistoryPicker";
import { SettingsPanel } from "./components/SettingsPanel";
import type { Clip } from "./lib/types";
import { logger } from "./lib/logger";
import "./index.css";

function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 1800);
  }, []);

  return { message, showToast };
}

function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { clips, setClips, fetchClips, saveClip, togglePin, deleteClip } =
    useClips();
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { message: toast, showToast } = useToast();

  useRealtimeClips(user?.id, clips, setClips);

  useEffect(() => {
    if (user) {
      fetchClips();
    }
  }, [user, fetchClips]);

  useEffect(() => {
    const unlistenSave = listen("save-clip", async () => {
      if (!user) return;
      try {
        const content = await invoke<string>("read_clipboard");
        if (!content || content.trim() === "") return;
        const deviceName = await invoke<string>("get_device_name");
        const saved = await saveClip({ content, device_name: deviceName });
        if (saved) {
          logger.info(
            `clip saved (${content.length} chars, device: ${deviceName})`,
          );
          showToast("Clip saved");
        } else {
          logger.info("clip skipped (duplicate)");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`save-clip failed: ${msg}`);
        showToast("Failed to save clip");
      }
    });

    const unlistenHistory = listen("show-history", () => {
      setShowHistory(true);
    });

    const unlistenSettings = listen("open-settings", () => {
      setShowSettings(true);
    });

    const unlistenShortcutFailed = listen<string>(
      "shortcut-registration-failed",
      (event) => {
        logger.warn(`Shortcut registration failed: ${event.payload}`);
        showToast("Shortcut conflict - check Settings");
      },
    );

    return () => {
      unlistenSave.then((fn) => fn());
      unlistenHistory.then((fn) => fn());
      unlistenSettings.then((fn) => fn());
      unlistenShortcutFailed.then((fn) => fn());
    };
  }, [user, saveClip, showToast]);

  const handleCopy = useCallback(
    async (clip: Clip) => {
      try {
        await invoke("write_clipboard", { text: clip.content });
        logger.info(`copied clip to clipboard (${clip.id})`);
        showToast("Copied to clipboard");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`copy failed: ${msg}`);
        showToast("Failed to copy");
      }
    },
    [showToast],
  );

  const handleSelectFromHistory = useCallback(
    async (clip: Clip) => {
      await handleCopy(clip);
      setShowHistory(false);
    },
    [handleCopy],
  );

  const handleTogglePin = useCallback(
    async (clipId: string) => {
      try {
        await togglePin(clipId);
        logger.info(`toggled pin on clip (${clipId})`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`togglePin failed: ${msg}`);
        showToast("Failed to toggle pin");
      }
    },
    [togglePin, showToast],
  );

  const handleDelete = useCallback(
    async (clipId: string) => {
      try {
        await deleteClip(clipId);
        logger.info(`deleted clip (${clipId})`);
        showToast("Clip deleted");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`delete failed: ${msg}`);
        showToast("Failed to delete clip");
      }
    },
    [deleteClip, showToast],
  );

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <AuthScreen onSignIn={signInWithGoogle} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header className="app-header">
        <h2>ClipSync</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-ghost"
            onClick={() => setShowSettings(true)}
            title="Settings (Cmd+,)"
            aria-label="Settings"
          >
            {"\u2699"}
          </button>
          <button className="btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <ClipList
        clips={clips}
        onCopy={handleCopy}
        onTogglePin={handleTogglePin}
        onDelete={handleDelete}
      />
      {showHistory && (
        <HistoryPicker
          clips={clips}
          onSelect={handleSelectFromHistory}
          onDismiss={() => setShowHistory(false)}
        />
      )}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          showToast={showToast}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
