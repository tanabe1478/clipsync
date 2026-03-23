import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useClips } from "../hooks/useClips";
import type { Clip } from "../lib/types";

const mockClips: readonly Clip[] = [
  {
    id: "1",
    user_id: "user-1",
    content: "Hello World",
    device_name: "MacBook",
    pinned: false,
    created_at: "2026-03-24T00:00:00Z",
  },
  {
    id: "2",
    user_id: "user-1",
    content: "Pinned clip",
    device_name: "Windows PC",
    pinned: true,
    created_at: "2026-03-23T00:00:00Z",
  },
];

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })),
  },
}));

describe("useClips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches clips ordered by pinned first then created_at desc", async () => {
    mockSelect.mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [...mockClips],
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useClips());

    await act(async () => {
      await result.current.fetchClips();
    });

    expect(result.current.clips).toHaveLength(2);
    expect(result.current.clips[0].id).toBe("1");
  });

  it("saves a new clip and prepends it to the list", async () => {
    const newClip: Clip = {
      id: "3",
      user_id: "user-1",
      content: "New content",
      device_name: "MacBook",
      pinned: false,
      created_at: "2026-03-24T01:00:00Z",
    };

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: newClip,
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useClips());

    await act(async () => {
      const saved = await result.current.saveClip({
        content: "New content",
        device_name: "MacBook",
      });
      expect(saved).toEqual(newClip);
    });

    expect(result.current.clips).toHaveLength(1);
    expect(result.current.clips[0].content).toBe("New content");
  });

  it("toggles pin on a clip immutably", async () => {
    const updatedClip: Clip = { ...mockClips[0], pinned: true };

    mockSelect.mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [...mockClips],
            error: null,
          }),
        }),
      }),
    });

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: updatedClip,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useClips());

    await act(async () => {
      await result.current.fetchClips();
    });

    const originalClips = result.current.clips;

    await act(async () => {
      await result.current.togglePin("1");
    });

    // Should be a new array reference (immutable)
    expect(result.current.clips).not.toBe(originalClips);
    expect(result.current.clips.find((c) => c.id === "1")?.pinned).toBe(true);
  });

  it("deletes a clip", async () => {
    mockSelect.mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [...mockClips],
            error: null,
          }),
        }),
      }),
    });

    mockDelete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const { result } = renderHook(() => useClips());

    await act(async () => {
      await result.current.fetchClips();
    });

    expect(result.current.clips).toHaveLength(2);

    await act(async () => {
      await result.current.deleteClip("1");
    });

    expect(result.current.clips).toHaveLength(1);
    expect(result.current.clips[0].id).toBe("2");
  });
});
