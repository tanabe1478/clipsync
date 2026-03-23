import { describe, it, expect } from "vitest";
import { keyEventToShortcutString } from "../lib/shortcutKeys";

function makeKeyEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    key: "",
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...overrides,
  } as KeyboardEvent;
}

describe("keyEventToShortcutString", () => {
  it("converts Cmd+Shift+C to CmdOrCtrl+Shift+C", () => {
    const result = keyEventToShortcutString(
      makeKeyEvent({ key: "c", metaKey: true, shiftKey: true }),
    );
    expect(result).toBe("CmdOrCtrl+Shift+C");
  });

  it("converts Ctrl+K to CmdOrCtrl+K", () => {
    const result = keyEventToShortcutString(
      makeKeyEvent({ key: "k", ctrlKey: true }),
    );
    expect(result).toBe("CmdOrCtrl+K");
  });

  it("converts Alt+Shift+V to Alt+Shift+V", () => {
    const result = keyEventToShortcutString(
      makeKeyEvent({ key: "v", altKey: true, shiftKey: true }),
    );
    expect(result).toBe("Alt+Shift+V");
  });

  it("returns null for lone modifier key", () => {
    expect(
      keyEventToShortcutString(makeKeyEvent({ key: "Meta", metaKey: true })),
    ).toBeNull();
    expect(
      keyEventToShortcutString(makeKeyEvent({ key: "Shift", shiftKey: true })),
    ).toBeNull();
  });

  it("returns null for key without modifier", () => {
    expect(
      keyEventToShortcutString(makeKeyEvent({ key: "a" })),
    ).toBeNull();
  });

  it("maps space key correctly", () => {
    const result = keyEventToShortcutString(
      makeKeyEvent({ key: " ", metaKey: true }),
    );
    expect(result).toBe("CmdOrCtrl+Space");
  });

  it("maps arrow keys correctly", () => {
    const result = keyEventToShortcutString(
      makeKeyEvent({ key: "ArrowUp", metaKey: true }),
    );
    expect(result).toBe("CmdOrCtrl+Up");
  });
});
