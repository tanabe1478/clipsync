import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Clip, NewClip } from "../lib/types";

const DEFAULT_LIMIT = 50;

export function useClips() {
  const [clips, setClips] = useState<readonly Clip[]>([]);

  const fetchClips = useCallback(async (limit: number = DEFAULT_LIMIT) => {
    const { data, error } = await supabase
      .from("clips")
      .select()
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch clips: ${error.message}`);
    }

    setClips(data ?? []);
    return data ?? [];
  }, []);

  const saveClip = useCallback(async (newClip: NewClip): Promise<Clip> => {
    const { data, error } = await supabase
      .from("clips")
      .insert(newClip)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save clip: ${error.message}`);
    }

    setClips((prev) => [data, ...prev]);
    return data;
  }, []);

  const togglePin = useCallback(async (clipId: string): Promise<Clip> => {
    const target = clips.find((c) => c.id === clipId);
    if (!target) {
      throw new Error(`Clip ${clipId} not found`);
    }

    const { data, error } = await supabase
      .from("clips")
      .update({ pinned: !target.pinned })
      .eq("id", clipId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to toggle pin: ${error.message}`);
    }

    setClips((prev) => prev.map((c) => (c.id === clipId ? data : c)));
    return data;
  }, [clips]);

  const deleteClip = useCallback(async (clipId: string): Promise<void> => {
    const { error } = await supabase
      .from("clips")
      .delete()
      .eq("id", clipId);

    if (error) {
      throw new Error(`Failed to delete clip: ${error.message}`);
    }

    setClips((prev) => prev.filter((c) => c.id !== clipId));
  }, []);

  return {
    clips,
    setClips,
    fetchClips,
    saveClip,
    togglePin,
    deleteClip,
  } as const;
}
