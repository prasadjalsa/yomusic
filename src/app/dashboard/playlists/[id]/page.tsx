"use client";

import { useEffect, useState } from "react";
import { usePlaylists } from "@/hooks/usePlaylists";
import PlaylistDetailView from "@/components/playlists/PlaylistDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { PlaylistDetail } from "@/types/playlist";
import { use } from "react";

export default function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { fetchPlaylist } = usePlaylists();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylist(id).then((data) => {
      setPlaylist(data);
      setLoading(false);
    });
  }, [fetchPlaylist, id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Playlist not found.</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/dashboard/playlists">Back to playlists</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/playlists">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
      </Button>
      <PlaylistDetailView playlist={playlist} />
    </div>
  );
}
