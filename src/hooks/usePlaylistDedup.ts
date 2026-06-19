"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePlaylistDedup(playlistId: string | null): Set<string> {
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!playlistId) {
      setExcluded(new Set());
      return;
    }

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("playlist_items")
        .select("youtube_video_id")
        .eq("playlist_id", playlistId);

      setExcluded(new Set((data ?? []).map((r) => r.youtube_video_id)));
    }

    load();
  }, [playlistId]);

  return excluded;
}
