import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface ShortcutConfig {
  readonly save_clip: string;
  readonly show_history: string;
}

export function useShortcuts() {
  const [config, setConfig] = useState<ShortcutConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShortcuts = useCallback(async () => {
    try {
      const result = await invoke<ShortcutConfig>("get_shortcuts");
      setConfig(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShortcuts();
  }, [fetchShortcuts]);

  const updateShortcut = useCallback(
    async (action: string, shortcut: string): Promise<ShortcutConfig> => {
      const result = await invoke<ShortcutConfig>("update_shortcut", {
        action,
        shortcut,
      });
      setConfig(result);
      return result;
    },
    [],
  );

  const resetShortcuts = useCallback(async (): Promise<ShortcutConfig> => {
    const result = await invoke<ShortcutConfig>("reset_shortcuts");
    setConfig(result);
    return result;
  }, []);

  return { config, loading, updateShortcut, resetShortcuts } as const;
}
