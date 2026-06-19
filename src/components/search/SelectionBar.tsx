"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListMusic, X } from "lucide-react";
import type { VideoResult } from "@/types/youtube";

interface SelectionBarProps {
  selected: VideoResult[];
  onClear: () => void;
  onPlaylistCreated: (playlistId: string) => void;
}

export default function SelectionBar({ selected, onClear, onPlaylistCreated }: SelectionBarProps) {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (selected.length === 0) return null;

  async function createPlaylist() {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: `Playlist created by Yomusicly with ${selected.length} songs.`,
          videoIds: selected.map((v) => v.videoId),
          videoMeta: selected.map((v) => ({
            videoId: v.videoId,
            title: v.title,
            channelTitle: v.channelTitle,
            thumbnailUrl: v.thumbnailUrl,
          })),
        }),
      });

      if (res.status === 401) {
        const data = await res.json();
        if (data.error === "youtube_auth_expired") {
          window.location.href = "/auth";
          return;
        }
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create playlist");
      }

      const data = await res.json();
      setTitle("");
      onClear();
      onPlaylistCreated(data.playlist.youtubeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  const estimatedCost = 50 + selected.length * 50;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ListMusic className="h-4 w-4 text-primary" />
            <span>{selected.length} song{selected.length !== 1 ? "s" : ""} selected</span>
            <span className="text-xs text-muted-foreground">(~{estimatedCost} quota units)</span>
          </div>
          <div className="flex flex-1 gap-2 w-full sm:w-auto">
            <Input
              placeholder="Playlist name…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
              className="flex-1"
              disabled={creating}
            />
            <Button onClick={createPlaylist} disabled={creating || !title.trim()}>
              {creating ? "Creating…" : "Create Playlist"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClear} disabled={creating}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </div>
    </div>
  );
}
