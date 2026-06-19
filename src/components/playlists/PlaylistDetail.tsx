"use client";

import Image from "next/image";
import { ExternalLink, Play, PlayCircle } from "lucide-react";
import type { PlaylistDetail, PlaylistItem } from "@/types/playlist";
import { youtubeVideoUrl } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerContext";
import type { VideoResult } from "@/types/youtube";
import { Button } from "@/components/ui/button";

interface PlaylistDetailProps {
  playlist: PlaylistDetail;
}

function itemToVideoResult(item: PlaylistItem): VideoResult {
  return {
    videoId: item.youtubeVideoId,
    title: item.title,
    channelTitle: item.channelTitle ?? "",
    thumbnailUrl: item.thumbnailUrl ?? "",
    publishedAt: "",
  };
}

export default function PlaylistDetailView({ playlist }: PlaylistDetailProps) {
  const { playVideo } = usePlayer();

  const allAsVideos = playlist.items.map(itemToVideoResult);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{playlist.title}</h1>
          {playlist.description && (
            <p className="text-muted-foreground text-sm mt-1">{playlist.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {playlist.videoCount} song{playlist.videoCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {allAsVideos.length > 0 && (
            <Button
              size="sm"
              onClick={() => playVideo(allAsVideos[0], allAsVideos)}
              className="gap-1.5"
            >
              <PlayCircle className="h-4 w-4" />
              Play All
            </Button>
          )}
          <a
            href={playlist.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline whitespace-nowrap"
          >
            YouTube <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="space-y-3">
        {playlist.items.map((item, idx) => {
          const asVideo = itemToVideoResult(item);
          return (
            <div key={item.youtubeVideoId} className="flex gap-3 items-center rounded-xl border bg-card p-3">
              <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{idx + 1}</span>
              {item.thumbnailUrl && (
                <div className="relative h-[54px] w-24 shrink-0 rounded overflow-hidden">
                  <Image src={item.thumbnailUrl} alt={item.title} fill sizes="96px" className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                {item.channelTitle && (
                  <p className="text-xs text-muted-foreground truncate">{item.channelTitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => playVideo(asVideo, allAsVideos)}
                  className="text-primary hover:text-primary/80 transition-colors"
                  title="Play"
                >
                  <Play className="h-4 w-4 fill-primary" />
                </button>
                <a
                  href={youtubeVideoUrl(item.youtubeVideoId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
