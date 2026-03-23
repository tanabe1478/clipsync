import { useCallback } from "react";
import { useShortcuts } from "../hooks/useShortcuts";
import { ShortcutRecorder } from "./ShortcutRecorder";
import { logger } from "../lib/logger";

interface SettingsPanelProps {
  readonly onClose: () => void;
  readonly showToast: (msg: string) => void;
}

export function SettingsPanel({ onClose, showToast }: SettingsPanelProps) {
  const { config, loading, updateShortcut, resetShortcuts } = useShortcuts();

  const handleUpdate = useCallback(
    async (action: string, shortcut: string) => {
      try {
        await updateShortcut(action, shortcut);
        logger.info(`Shortcut updated: ${action} = ${shortcut}`);
        showToast("Shortcut updated");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to update shortcut: ${msg}`);
        showToast(msg);
      }
    },
    [updateShortcut, showToast],
  );

  const handleReset = useCallback(async () => {
    try {
      await resetShortcuts();
      logger.info("Shortcuts reset to defaults");
      showToast("Shortcuts reset to defaults");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to reset shortcuts: ${msg}`);
      showToast(msg);
    }
  }, [resetShortcuts, showToast]);

  if (loading || !config) {
    return (
      <div className="history-overlay" onClick={onClose}>
        <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
          <div className="settings-header">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span>Keyboard Shortcuts</span>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">
            {"\u2715"}
          </button>
        </div>
        <div className="settings-body">
          <ShortcutRecorder
            label="Save Clip"
            currentShortcut={config.save_clip}
            onRecord={(s) => handleUpdate("save_clip", s)}
          />
          <ShortcutRecorder
            label="Show History"
            currentShortcut={config.show_history}
            onRecord={(s) => handleUpdate("show_history", s)}
          />
          <div className="settings-footer">
            <button className="btn" onClick={handleReset}>
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
