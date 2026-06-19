"use client";

import { useState, useEffect, useRef } from "react";
import FilterForm from "@/components/filters/FilterForm";
import SearchResults from "@/components/search/SearchResults";
import SelectionBar from "@/components/search/SelectionBar";
import QuotaWarning from "@/components/search/QuotaWarning";
import PlaylistSelector from "@/components/playlists/PlaylistSelector";
import { useYouTubeSearch } from "@/hooks/useYouTubeSearch";
import { usePlaylistDedup } from "@/hooks/usePlaylistDedup";
import type { SearchFilters } from "@/types/filters";
import type { Playlist } from "@/types/playlist";
import type { VideoResult } from "@/types/youtube";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { youtubePlaylistUrl } from "@/lib/utils";

export default function DashboardPage() {
  const { videos, loading, error, search } = useYouTubeSearch();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetPlaylist, setTargetPlaylist] = useState<Playlist | null>(null);
  const [lastFilters, setLastFilters] = useState<SearchFilters | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const didResume = useRef(false);

  const excludedVideoIds = usePlaylistDedup(targetPlaylist?.id ?? null);

  // On mount: check for a pending playlist saved before re-auth redirect
  useEffect(() => {
    if (didResume.current) return;
    didResume.current = true;

    const raw = sessionStorage.getItem("pending_playlist");
    if (!raw) return;
    sessionStorage.removeItem("pending_playlist");

    const pending = JSON.parse(raw) as {
      title: string | null;
      targetPlaylistId: string | null;
      videoIds: string[];
      videoMeta: Array<{ videoId: string; title: string; channelTitle: string; thumbnailUrl: string }>;
    };

    if (!pending.videoIds?.length) return;

    setResuming(true);
    setResumeError(null);

    async function submitPending() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const providerToken = session?.provider_token;

        if (!providerToken) {
          setResumeError("YouTube sign-in required. Please try again.");
          setResuming(false);
          return;
        }

        if (pending.targetPlaylistId) {
          // Append to existing playlist
          const res = await fetch(`/api/playlists/${pending.targetPlaylistId}/append`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-provider-token": providerToken },
            body: JSON.stringify({ videoIds: pending.videoIds, videoMeta: pending.videoMeta }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);
          setSuccessMsg(`Added ${data.added} song${data.added !== 1 ? "s" : ""} to playlist.`);
          setSuccessUrl(youtubePlaylistUrl(data.youtubeId ?? ""));
        } else if (pending.title) {
          // Create new playlist
          const res = await fetch("/api/playlists", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-provider-token": providerToken },
            body: JSON.stringify({
              title: pending.title,
              description: `Playlist created by Yomusicly with ${pending.videoIds.length} songs.`,
              videoIds: pending.videoIds,
              videoMeta: pending.videoMeta,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);
          setSuccessUrl(youtubePlaylistUrl(data.playlist.youtubeId));
          setSuccessMsg("Playlist created!");
        }
      } catch (err) {
        setResumeError(err instanceof Error ? err.message : "Failed after sign-in.");
      } finally {
        setResuming(false);
      }
    }

    submitPending();
  }, []);

  function handleSearch(filters: SearchFilters) {
    setLastFilters(filters);
    setSelected(new Set());
    setSuccessUrl(null);
    setSuccessMsg(null);
    // Fetch extra songs to compensate for ones hidden by playlist dedup
    search(filters, excludedVideoIds.size);
  }

  function toggleVideo(videoId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
  }

  const selectedVideos: VideoResult[] = videos.filter((v) =>
    selected.has(v.videoId) && !excludedVideoIds.has(v.videoId)
  );

  return (
    <div className="space-y-6">
      {resuming && (
        <div className="rounded-xl border bg-muted/50 p-4 text-sm flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Finalising your playlist…
        </div>
      )}
      {resumeError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
          {resumeError}
        </div>
      )}
      {successMsg && successUrl && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-green-800 text-sm flex items-center gap-2">
          {successMsg}{" "}
          <a href={successUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
            Open on YouTube
          </a>
        </div>
      )}

      {/* Target playlist selector */}
      <PlaylistSelector
        selectedId={targetPlaylist?.id ?? null}
        onChange={setTargetPlaylist}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Find Songs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastFilters && !loading && (
            <QuotaWarning estimatedCost={100} action="search" />
          )}
          <FilterForm onSearch={handleSearch} loading={loading} />
        </CardContent>
      </Card>

      <SearchResults
        videos={videos}
        loading={loading}
        error={error}
        selected={selected}
        excludedVideoIds={excludedVideoIds}
        onToggle={toggleVideo}
      />

      <SelectionBar
        selected={selectedVideos}
        targetPlaylist={targetPlaylist}
        onClear={() => setSelected(new Set())}
        onPlaylistCreated={(ytId) => {
          setSuccessMsg("Playlist created!");
          setSuccessUrl(youtubePlaylistUrl(ytId));
        }}
        onPlaylistAppended={(ytId, added) => {
          setSuccessMsg(`Added ${added} song${added !== 1 ? "s" : ""} to playlist.`);
          setSuccessUrl(youtubePlaylistUrl(ytId));
        }}
      />
    </div>
  );
}
