import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRealtimeClips } from "../hooks/useRealtimeClips";
import type { Clip } from "../lib/types";

let channelCallback: ((payload: unknown) => void) | null = null;
const mockUnsubscribe = vi.fn();

vi.mock("../lib/supabase", () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn((_event: string, _filter: unknown, cb: (payload: unknown) => void) => {
        channelCallback = cb;
        return {
          subscribe: vi.fn().mockReturnValue({ unsubscribe: mockUnsubscribe }),
        };
      }),
    })),
    removeChannel: vi.fn(),
  },
}));

describe("useRealtimeClips", () => {
  const existingClips: readonly Clip[] = [
    {
      id: "1",
      user_id: "user-1",
      content: "Existing",
      device_name: "Mac",
      pinned: false,
      created_at: "2026-03-24T00:00:00Z",
    },
  ];

  const mockSetClips = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    channelCallback = null;
  });

  it("subscribes to realtime channel on mount", () => {
    renderHook(() =>
      useRealtimeClips("user-1", existingClips, mockSetClips),
    );

    expect(channelCallback).not.toBeNull();
  });

  it("prepends new clip on INSERT event", () => {
    renderHook(() =>
      useRealtimeClips("user-1", existingClips, mockSetClips),
    );

    const newClip: Clip = {
      id: "2",
      user_id: "user-1",
      content: "New from other device",
      device_name: "Windows",
      pinned: false,
      created_at: "2026-03-24T01:00:00Z",
    };

    act(() => {
      channelCallback!({ eventType: "INSERT", new: newClip });
    });

    expect(mockSetClips).toHaveBeenCalled();
    const updater = mockSetClips.mock.calls[0][0];
    const result = updater(existingClips);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("2");
  });

  it("updates clip on UPDATE event", () => {
    renderHook(() =>
      useRealtimeClips("user-1", existingClips, mockSetClips),
    );

    const updatedClip: Clip = { ...existingClips[0], pinned: true };

    act(() => {
      channelCallback!({ eventType: "UPDATE", new: updatedClip });
    });

    expect(mockSetClips).toHaveBeenCalled();
    const updater = mockSetClips.mock.calls[0][0];
    const result = updater(existingClips);
    expect(result[0].pinned).toBe(true);
  });

  it("removes clip on DELETE event", () => {
    renderHook(() =>
      useRealtimeClips("user-1", existingClips, mockSetClips),
    );

    act(() => {
      channelCallback!({ eventType: "DELETE", old: { id: "1" } });
    });

    expect(mockSetClips).toHaveBeenCalled();
    const updater = mockSetClips.mock.calls[0][0];
    const result = updater(existingClips);
    expect(result).toHaveLength(0);
  });
});
