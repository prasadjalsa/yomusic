"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListMusic, X, PlusCircle } from "lucide-react";
import type { VideoResult } from "@/types/youtube";
import type { Playlist } from "@/types/playlist";
import { createClient } from "@/lib/supabase/client";

interface SelectionBarProps {
  selected: VideoResult[];
  targetPlaylist: Playlist | null;
  onClear: () => void;
  onPlaylistCreated: (playlistId: string) => void;
  onPlaylistAppended: (playlistId: string, added: number) => void;
}

export default function SelectionBar({
  selected,
  targetPlaylist,
  onClear,
  onPlaylistCreated,
  onPlaylistAppended,
}: SelectionBarProps) {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (selected.length === 0) return null;

  async function getProviderToken(): Promise<string | null> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    console.debug("[SelectionBar] session:", !!session, "provider_token:", !!session?.provider_token);

    if (!session?.provider_token) {
      sessionStorage.setItem("pending_playlist", JSON.stringify({
        title: targetPlaylist ? null : title.trim(),
        targetPlaylistId: targetPlaylist?.id ?? null,
        videoIds: selected.map((v) => v.videoId),
        videoMeta: selected.map((v) => ({
          videoId: v.videoId,
          title: v.title,
          channelTitle: v.channelTitle,
          thumbnailUrl: v.thumbnailUrl,
        })),
      }));
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/youtube",
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      return null;
    }
    return session.provider_token;
  }

  async function appendToPlaylist() {
    if (!targetPlaylist) return;
    setCreating(true);
    setError(null);

    try {
      const providerToken = await getProviderToken();
      if (!providerToken) return;

      const res = await fetch(`/api/playlists/${targetPlaylist.id}/append`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-provider-token": providerToken,
        },
        body: JSON.stringify({
          videoIds: selected.map((v) => v.videoId),
          videoMeta: selected.map((v) => ({
            videoId: v.videoId,
            title: v.title,
            channelTitle: v.channelTitle,
            thumbnailUrl: v.thumbnailUrl,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);

      onClear();
      onPlaylistAppended(targetPlaylist.youtubeId, data.added);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  async function createPlaylist() {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const providerToken = await getProviderToken();
      if (!providerToken) return;

      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-provider-token": providerToken,
        },
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);

      setTitle("");
      onClear();
      onPlaylistCreated(data.playlist.youtubeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  const estimatedCost = targetPlaylist
    ? selected.length * 50
    : 50 + selected.length * 50;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium shrink-0">
            <ListMusic className="h-4 w-4 text-primary" />
            <span>{selected.length} song{selected.length !== 1 ? "s" : ""} selected</span>
            <span className="text-xs text-muted-foreground">(~{estimatedCost} units)</span>
          </div>

          {targetPlaylist ? (
            <div className="flex flex-1 gap-2 w-full sm:w-auto">
              <Button
                onClick={appendToPlaylist}
                disabled={creating}
                className="flex-1 sm:flex-none"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {creating ? "Adding…" : `Add to "${targetPlaylist.title}"`}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClear} disabled={creating}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
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
          )}
        </div>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </div>
    </div>
  );
}
