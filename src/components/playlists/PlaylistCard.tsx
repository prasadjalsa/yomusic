"use client";

import { useState } from "react";
import { ExternalLink, Trash2, PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Playlist } from "@/types/playlist";
import { formatDate } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerContext";
import type { VideoResult } from "@/types/youtube";

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete: (id: string) => void;
}

export default function PlaylistCard({ playlist, onDelete }: PlaylistCardProps) {
  const { playVideo } = usePlayer();
  const [loadingPlay, setLoadingPlay] = useState(false);

  async function handlePlayAll() {
    setLoadingPlay(true);
    try {
      const res = await fetch(`/api/playlists/${playlist.id}`);
      if (!res.ok) return;
      const data = await res.json();
      const videos: VideoResult[] = (data.playlist.items ?? []).map(
        (item: { youtubeVideoId: string; title: string; channelTitle: string | null; thumbnailUrl: string | null }) => ({
          videoId: item.youtubeVideoId,
          title: item.title,
          channelTitle: item.channelTitle ?? "",
          thumbnailUrl: item.thumbnailUrl ?? "",
          publishedAt: "",
        })
      );
      if (videos.length > 0) playVideo(videos[0], videos);
    } finally {
      setLoadingPlay(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="font-medium truncate">{playlist.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {playlist.videoCount} song{playlist.videoCount !== 1 ? "s" : ""} &middot; {formatDate(playlist.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={handlePlayAll}
            disabled={loadingPlay || playlist.videoCount === 0}
            className="gap-1.5"
          >
            {loadingPlay ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PlayCircle className="h-3.5 w-3.5" />
            )}
            Play
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={playlist.youtubeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              YouTube
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(playlist.id)}
            title="Remove from history"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
