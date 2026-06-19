import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { PlaylistDetail } from "@/types/playlist";
import { youtubeVideoUrl } from "@/lib/utils";

interface PlaylistDetailProps {
  playlist: PlaylistDetail;
}

export default function PlaylistDetailView({ playlist }: PlaylistDetailProps) {
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
        <a
          href={playlist.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline whitespace-nowrap"
        >
          Open on YouTube <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="space-y-3">
        {playlist.items.map((item, idx) => (
          <div key={item.youtubeVideoId} className="flex gap-3 items-center rounded-xl border bg-card p-3">
            <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{idx + 1}</span>
            {item.thumbnailUrl && (
              <div className="relative h-[54px] w-24 shrink-0 rounded overflow-hidden">
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{item.title}</p>
              {item.channelTitle && (
                <p className="text-xs text-muted-foreground truncate">{item.channelTitle}</p>
              )}
            </div>
            <a
              href={youtubeVideoUrl(item.youtubeVideoId)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-primary hover:text-primary/80"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
