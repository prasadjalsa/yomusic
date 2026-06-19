import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Playlist } from "@/types/playlist";
import { formatDate } from "@/lib/utils";

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete: (id: string) => void;
}

export default function PlaylistCard({ playlist, onDelete }: PlaylistCardProps) {
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
