import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Clip } from "../lib/types";

type SetClips = (updater: (prev: readonly Clip[]) => readonly Clip[]) => void;

export function useRealtimeClips(
  userId: string | undefined,
  _clips: readonly Clip[],
  setClips: SetClips,
) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`clips:${userId}`)
      .on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table: "clips",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { eventType: string; new: Clip; old: { id: string } }) => {
          if (payload.eventType === "INSERT") {
            setClips((prev) => {
              // Skip if already exists (local saveClip already added it)
              if (prev.some((c) => c.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setClips((prev) =>
              prev.map((c) => (c.id === payload.new.id ? payload.new : c)),
            );
          } else if (payload.eventType === "DELETE") {
            setClips((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, setClips]);
}
