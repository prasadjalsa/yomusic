"use client";

import type { VideoResult } from "@/types/youtube";
import SongCard from "./SongCard";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResultsProps {
  videos: VideoResult[];
  loading: boolean;
  error: string | null;
  selected: Set<string>;
  excludedVideoIds: Set<string>;
  onToggle: (videoId: string) => void;
}

export default function SearchResults({
  videos,
  loading,
  error,
  selected,
  excludedVideoIds,
  onToggle,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
        {error}
      </div>
    );
  }

  const visible = videos.filter((v) => !excludedVideoIds.has(v.videoId));
  const hiddenCount = videos.length - visible.length;

  if (videos.length === 0) return null;

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        {visible.length} song{visible.length !== 1 ? "s" : ""} found
        {hiddenCount > 0 && (
          <span className="ml-1 text-xs text-amber-600">
            ({hiddenCount} already in playlist — hidden)
          </span>
        )}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((video) => (
          <SongCard
            key={video.videoId}
            video={video}
            checked={selected.has(video.videoId)}
            onToggle={() => onToggle(video.videoId)}
            allVideos={visible}
          />
        ))}
      </div>
    </div>
  );
}
