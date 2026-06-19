"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import FilterForm from "@/components/filters/FilterForm";
import SearchResults from "@/components/search/SearchResults";
import SelectionBar from "@/components/search/SelectionBar";
import QuotaWarning from "@/components/search/QuotaWarning";
import { useYouTubeSearch } from "@/hooks/useYouTubeSearch";
import type { SearchFilters } from "@/types/filters";
import type { VideoResult } from "@/types/youtube";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { youtubePlaylistUrl } from "@/lib/utils";

export default function DashboardPage() {
  const { videos, loading, error, search } = useYouTubeSearch();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingVideos, setPendingVideos] = useState<VideoResult[]>([]);
  const [lastFilters, setLastFilters] = useState<SearchFilters | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const didResume = useRef(false);

  // On mount: check for a pending playlist saved before re-auth redirect
  useEffect(() => {
    if (didResume.current) return;
    didResume.current = true;

    const raw = sessionStorage.getItem("pending_playlist");
    if (!raw) return;
    sessionStorage.removeItem("pending_playlist");

    const pending = JSON.parse(raw) as {
      title: string;
      videoIds: string[];
      videoMeta: Array<{ videoId: string; title: string; channelTitle: string; thumbnailUrl: string }>;
    };

    if (!pending.title || !pending.videoIds?.length) return;

    setResuming(true);
    setResumeError(null);

    async function submitPending() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const providerToken = session?.provider_token;

        if (!providerToken) {
          setResumeError("YouTube sign-in required. Please try creating the playlist again.");
          setResuming(false);
          return;
        }

        const res = await fetch("/api/playlists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-provider-token": providerToken,
          },
          body: JSON.stringify({
            title: pending.title,
            description: `Playlist created by Yomusicly with ${pending.videoIds.length} songs.`,
            videoIds: pending.videoIds,
            videoMeta: pending.videoMeta,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || data.error || `Error ${res.status}`);
        }

        setSuccessUrl(youtubePlaylistUrl(data.playlist.youtubeId));
      } catch (err) {
        setResumeError(err instanceof Error ? err.message : "Failed to create playlist after sign-in.");
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
    search(filters);
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
    selected.has(v.videoId)
  );

  return (
    <div className="space-y-6">
      {/* Resume status after re-auth redirect */}
      {resuming && (
        <div className="rounded-xl border bg-muted/50 p-4 text-sm flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Creating your playlist…
        </div>
      )}
      {resumeError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
          {resumeError}
        </div>
      )}

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

      {successUrl && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-green-800 text-sm flex items-center gap-2">
          Playlist created!{" "}
          <a
            href={successUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            Open on YouTube
          </a>
        </div>
      )}

      <SearchResults
        videos={videos}
        loading={loading}
        error={error}
        selected={selected}
        onToggle={toggleVideo}
      />

      <SelectionBar
        selected={selectedVideos}
        onClear={() => setSelected(new Set())}
        onPlaylistCreated={(ytId) =>
          setSuccessUrl(`https://www.youtube.com/playlist?list=${ytId}`)
        }
      />
    </div>
  );
}
