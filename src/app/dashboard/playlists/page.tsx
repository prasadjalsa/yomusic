"use client";

import { useEffect, useState } from "react";
import { usePlaylists } from "@/hooks/usePlaylists";
import PlaylistCard from "@/components/playlists/PlaylistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ListMusic } from "lucide-react";

export default function PlaylistsPage() {
  const { playlists, loading, error, fetchPlaylists, deletePlaylist } = usePlaylists();
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  async function handleDelete(id: string) {
    setDeleting(id);
    await deletePlaylist(id);
    setDeleting(null);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ListMusic className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">My Playlists</h1>
        <span className="text-sm text-muted-foreground">({playlists.length})</span>
      </div>

      {playlists.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center text-muted-foreground">
          <ListMusic className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No playlists yet. Search for songs and create your first playlist!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {playlists.map((pl) => (
            <div key={pl.id} className={deleting === pl.id ? "opacity-50 pointer-events-none" : ""}>
              <PlaylistCard playlist={pl} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
