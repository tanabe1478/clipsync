import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

function extractTokensFromUrl(url: string): { accessToken: string; refreshToken: string } | null {
  // URL format: clipsync://auth/callback#access_token=...&refresh_token=...
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return null;

  const params = new URLSearchParams(url.slice(hashIndex + 1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for deep link OAuth callback from Tauri
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    import("@tauri-apps/api/event").then(({ listen }) => {
      listen<string>("deep-link-auth", async (event) => {
        const tokens = extractTokensFromUrl(event.payload);
        if (!tokens) return;

        const { data, error } = await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });

        if (!error && data.session) {
          setUser(data.session.user);
          setLoading(false);
        }
      }).then((fn) => {
        unlisten = fn;
      });
    });

    return () => {
      unlisten?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // Get redirect URL from Rust (localhost in dev, clipsync:// in release)
    const { invoke } = await import("@tauri-apps/api/core");
    const redirectTo = await invoke<string>("get_auth_redirect_url");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        skipBrowserRedirect: true,
        redirectTo,
      },
    });

    if (error) {
      throw new Error(`Failed to sign in: ${error.message}`);
    }

    if (data.url) {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(data.url);
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Failed to sign out: ${error.message}`);
    }
    setUser(null);
  }, []);

  return { user, loading, signInWithGoogle, signOut } as const;
}

export { extractTokensFromUrl };
