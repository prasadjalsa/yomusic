"use client";

import { useState, useCallback } from "react";
import type { Playlist, PlaylistDetail } from "@/types/playlist";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/playlists");
      if (!res.ok) throw new Error("Failed to fetch playlists");
      const data = await res.json();
      setPlaylists(data.playlists);
    } catch {
      setError("Failed to load playlists.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlaylist = useCallback(
    async (id: string): Promise<PlaylistDetail | null> => {
      try {
        const res = await fetch(`/api/playlists/${id}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.playlist;
      } catch {
        return null;
      }
    },
    []
  );

  const deletePlaylist = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { playlists, loading, error, fetchPlaylists, fetchPlaylist, deletePlaylist };
}
