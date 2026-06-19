import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { VideoResult } from "@/types/youtube";
import { youtubeVideoUrl } from "@/lib/utils";

interface SongCardProps {
  video: VideoResult;
  checked: boolean;
  onToggle: () => void;
}

export default function SongCard({ video, checked, onToggle }: SongCardProps) {
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
        <a
          href={youtubeVideoUrl(video.videoId)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
        >
          Open <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
