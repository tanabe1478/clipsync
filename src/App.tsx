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

function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { clips, setClips, fetchClips, saveClip, togglePin, deleteClip } = useClips();
  const [showHistory, setShowHistory] = useState(false);

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
        if (!content) return;
        const deviceName = await invoke<string>("get_device_name");
        await saveClip({ content, device_name: deviceName });
      } catch (err) {
        // Silently fail for now
      }
    });

    const unlistenHistory = listen("show-history", () => {
      setShowHistory(true);
    });

    return () => {
      unlistenSave.then((fn) => fn());
      unlistenHistory.then((fn) => fn());
    };
  }, [user, saveClip]);

  const handleCopy = useCallback(async (clip: Clip) => {
    try {
      await invoke("write_clipboard", { text: clip.content });
    } catch (err) {
      // Silently fail for now
    }
  }, []);

  const handleSelectFromHistory = useCallback(async (clip: Clip) => {
    await handleCopy(clip);
    setShowHistory(false);
  }, [handleCopy]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSignIn={signInWithGoogle} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>ClipSync</h2>
        <button onClick={signOut} style={{ background: "none", border: "1px solid #ccc", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>
          Sign out
        </button>
      </header>
      <ClipList clips={clips} onCopy={handleCopy} onTogglePin={togglePin} onDelete={deleteClip} />
      {showHistory && (
        <HistoryPicker
          clips={clips}
          onSelect={handleSelectFromHistory}
          onDismiss={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

export default App;
