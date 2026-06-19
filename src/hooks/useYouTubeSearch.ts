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

  const search = useCallback(async (filters: SearchFilters, excludedCount = 0) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch extra songs to cover those that will be hidden by playlist dedup
      const boostedCount = Math.min(filters.count + excludedCount, 50) as typeof filters.count;
      const boostedFilters = excludedCount > 0 ? { ...filters, count: boostedCount } : filters;

      const res = await fetch("/api/youtube/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: boostedFilters, count: boostedFilters.count }),
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