import { invoke } from "@tauri-apps/api/core";

export const logger = {
  info: (message: string) => {
    invoke("log_from_frontend", { level: "info", message });
  },
  warn: (message: string) => {
    invoke("log_from_frontend", { level: "warn", message });
  },
  error: (message: string) => {
    invoke("log_from_frontend", { level: "error", message });
  },
};
