import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth, extractTokensFromUrl } from "../hooks/useAuth";

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

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(vi.fn()),
}));

describe("extractTokensFromUrl", () => {
  it("extracts tokens from a valid deep link URL", () => {
    const url =
      "clipsync://auth/callback#access_token=abc123&refresh_token=def456&token_type=bearer";
    const result = extractTokensFromUrl(url);
    expect(result).toEqual({
      accessToken: "abc123",
      refreshToken: "def456",
    });
  });

  it("returns null if no hash fragment", () => {
    expect(extractTokensFromUrl("clipsync://auth/callback")).toBeNull();
  });

  it("returns null if access_token is missing", () => {
    const url = "clipsync://auth/callback#refresh_token=def456";
    expect(extractTokensFromUrl(url)).toBeNull();
  });

  it("returns null if refresh_token is missing", () => {
    const url = "clipsync://auth/callback#access_token=abc123";
    expect(extractTokensFromUrl(url)).toBeNull();
  });
});

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

  it("signInWithGoogle passes redirectTo for deep link", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/..." },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        skipBrowserRedirect: true,
        redirectTo: "clipsync://auth/callback",
      },
    });
  });
});
