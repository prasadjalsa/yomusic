"use client";

import { useState, useCallback } from "react";
import FilterForm from "@/components/filters/FilterForm";
import SearchResults from "@/components/search/SearchResults";
import SelectionBar from "@/components/search/SelectionBar";
import QuotaWarning from "@/components/search/QuotaWarning";
import { useYouTubeSearch } from "@/hooks/useYouTubeSearch";
import type { SearchFilters } from "@/types/filters";
import type { VideoResult } from "@/types/youtube";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export default function DashboardPage() {
  const { videos, loading, error, search } = useYouTubeSearch();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastFilters, setLastFilters] = useState<SearchFilters | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

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
