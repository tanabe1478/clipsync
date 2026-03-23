import type { Page } from "@playwright/test";

/**
 * Inject Tauri API mocks into the browser page.
 * This allows the React app to run in a normal browser without the Tauri runtime.
 */
export async function injectTauriMocks(page: Page) {
  await page.addInitScript(() => {
    // Mock clipboard content
    let clipboardContent = "test clipboard content";

    // Mock __TAURI_INTERNALS__ which @tauri-apps/api checks
    (window as any).__TAURI_INTERNALS__ = {
      invoke: (cmd: string, args?: Record<string, unknown>) => {
        switch (cmd) {
          case "read_clipboard":
            return Promise.resolve(clipboardContent);
          case "write_clipboard":
            clipboardContent = (args?.text as string) ?? "";
            return Promise.resolve();
          case "get_device_name":
            return Promise.resolve("e2e-test-device");
          case "get_auth_redirect_url":
            return Promise.resolve("http://localhost:54321/auth/callback");
          case "log_from_frontend":
            // eslint-disable-next-line no-console
            console.log(
              `[tauri-mock][${args?.level}] ${args?.message}`,
            );
            return Promise.resolve();
          default:
            console.warn(`[tauri-mock] unhandled command: ${cmd}`);
            return Promise.resolve(null);
        }
      },
      convertFileSrc: (path: string) => path,
    };

    // Mock @tauri-apps/api/event
    const listeners: Record<string, ((payload: any) => void)[]> = {};
    (window as any).__TAURI_MOCK_EMIT__ = (event: string, payload?: any) => {
      (listeners[event] ?? []).forEach((fn) => fn({ payload }));
    };
    (window as any).__TAURI_INTERNALS__.invoke_key =
      "tauri-e2e-mock";

    // Patch event module
    (window as any).__TAURI_EVENT_LISTENERS__ = listeners;
  });
}

/**
 * Emit a Tauri event from the test to the browser page.
 */
export async function emitTauriEvent(
  page: Page,
  event: string,
  payload?: unknown,
) {
  await page.evaluate(
    ({ event, payload }) => {
      (window as any).__TAURI_MOCK_EMIT__?.(event, payload);
    },
    { event, payload },
  );
}
