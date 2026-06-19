"use client";

import type { VideoResult } from "@/types/youtube";
import SongCard from "./SongCard";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResultsProps {
  videos: VideoResult[];
  loading: boolean;
  error: string | null;
  selected: Set<string>;
  onToggle: (videoId: string) => void;
}

export default function SearchResults({
  videos,
  loading,
  error,
  selected,
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

  if (videos.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        {videos.length} song{videos.length !== 1 ? "s" : ""} found
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <SongCard
            key={video.videoId}
            video={video}
            checked={selected.has(video.videoId)}
            onToggle={() => onToggle(video.videoId)}
          />
        ))}
      </div>
    </div>
  );
}
