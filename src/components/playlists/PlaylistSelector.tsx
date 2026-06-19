"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Playlist } from "@/types/playlist";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListMusic } from "lucide-react";
import { youtubePlaylistUrl } from "@/lib/utils";

interface PlaylistSelectorProps {
  selectedId: string | null;
  onChange: (playlist: Playlist | null) => void;
}

export default function PlaylistSelector({ selectedId, onChange }: PlaylistSelectorProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPlaylists(
        (data ?? []).map((pl) => ({
          id: pl.id,
          youtubeId: pl.youtube_id,
          title: pl.title,
          description: pl.description,
          videoCount: pl.video_count,
          createdAt: pl.created_at,
          youtubeUrl: youtubePlaylistUrl(pl.youtube_id),
        }))
      );
    }
    load();
  }, []);

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    if (!next) onChange(null);
  }

  function handleSelect(id: string) {
    const pl = playlists.find((p) => p.id === id) ?? null;
    onChange(pl);
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3">
      <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          className="rounded border-input accent-primary h-4 w-4"
        />
        <ListMusic className="h-4 w-4 text-primary" />
        Add to existing playlist
      </label>

      {enabled && (
        <div className="flex-1 max-w-xs">
          {playlists.length === 0 ? (
            <p className="text-xs text-muted-foreground">No saved playlists yet.</p>
          ) : (
            <Select value={selectedId ?? ""} onValueChange={handleSelect}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select a playlist…" />
              </SelectTrigger>
              <SelectContent>
                {playlists.map((pl) => (
                  <SelectItem key={pl.id} value={pl.id}>
                    {pl.title} ({pl.videoCount} songs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {enabled && selectedId && (
        <p className="text-xs text-muted-foreground">
          Songs already in this playlist will be hidden from results.
        </p>
      )}
    </div>
  );
}
