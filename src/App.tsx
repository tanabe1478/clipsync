import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAuth } from "./hooks/useAuth";
import { useClips } from "./hooks/useClips";
import { useRealtimeClips } from "./hooks/useRealtimeClips";
import { AuthScreen } from "./components/AuthScreen";
import { ClipList } from "./components/ClipList";
import { HistoryPicker } from "./components/HistoryPicker";
import type { Clip } from "./lib/types";
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
        await saveClip({ content, device_name: deviceName });
        showToast("Clip saved");
      } catch (_err) {
        showToast("Failed to save clip");
      }
    });

    const unlistenHistory = listen("show-history", () => {
      setShowHistory(true);
    });

    return () => {
      unlistenSave.then((fn) => fn());
      unlistenHistory.then((fn) => fn());
    };
  }, [user, saveClip, showToast]);

  const handleCopy = useCallback(
    async (clip: Clip) => {
      try {
        await invoke("write_clipboard", { text: clip.content });
        showToast("Copied to clipboard");
      } catch (_err) {
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
        <button className="btn" onClick={signOut}>
          Sign out
        </button>
      </header>
      <ClipList
        clips={clips}
        onCopy={handleCopy}
        onTogglePin={togglePin}
        onDelete={deleteClip}
      />
      {showHistory && (
        <HistoryPicker
          clips={clips}
          onSelect={handleSelectFromHistory}
          onDismiss={() => setShowHistory(false)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
