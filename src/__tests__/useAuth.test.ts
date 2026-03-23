import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth } from "../hooks/useAuth";

const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      signOut: () => mockSignOut(),
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: unknown) => mockOnAuthStateChange(cb),
    },
  },
}));

vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it("starts with null user and loading true", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it("sets user when session exists", async () => {
    const mockUser = { id: "user-1", email: "test@example.com" };
    mockGetSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      // Wait for useEffect to complete
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it("signOut clears user", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });
});
