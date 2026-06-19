"use client";

import { useState, useCallback } from "react";
import type { SearchFilters } from "@/types/filters";
import type { VideoResult } from "@/types/youtube";

interface SearchState {
  videos: VideoResult[];
  loading: boolean;
  error: string | null;
  quotaUsed: number;
}

export function useYouTubeSearch() {
  const [state, setState] = useState<SearchState>({
    videos: [],
    loading: false,
    error: null,
    quotaUsed: 0,
  });

  const search = useCallback(async (filters: SearchFilters) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch("/api/youtube/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters, count: filters.count }),
      });

      if (res.status === 401) {
        const data = await res.json();
        if (data.error === "youtube_auth_expired") {
          window.location.href = "/auth";
          return;
        }
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Please sign in again.",
        }));
        return;
      }

      if (res.status === 429) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Daily search quota exceeded. Try again tomorrow.",
        }));
        return;
      }

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();
      setState({
        videos: data.videos,
        loading: false,
        error: null,
        quotaUsed: data.quotaUsed,
      });
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Something went wrong. Please try again.",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ videos: [], loading: false, error: null, quotaUsed: 0 });
  }, []);

  return { ...state, search, reset };
}
