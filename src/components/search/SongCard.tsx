"use client";

import Image from "next/image";
import { ExternalLink, Play } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { VideoResult } from "@/types/youtube";
import { youtubeVideoUrl } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerContext";

interface SongCardProps {
  video: VideoResult;
  checked: boolean;
  onToggle: () => void;
  allVideos: VideoResult[];
}

export default function SongCard({ video, checked, onToggle, allVideos }: SongCardProps) {
  const { playVideo } = usePlayer();

  return (
    <div
      className={`flex gap-3 rounded-xl border p-3 cursor-pointer transition-colors hover:bg-accent/50 ${
        checked ? "border-primary bg-primary/5" : "bg-card"
      }`}
      onClick={onToggle}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 shrink-0"
      />
      {video.thumbnailUrl && (
        <div className="relative h-[68px] w-[120px] shrink-0 rounded overflow-hidden">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="120px"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2 leading-snug">{video.title}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{video.channelTitle}</p>
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              playVideo(video, allVideos);
            }}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Play className="h-3 w-3 fill-primary" />
            Play
          </button>
          <a
            href={youtubeVideoUrl(video.videoId)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </a>
        </div>
      </div>
    </div>
  );
}
