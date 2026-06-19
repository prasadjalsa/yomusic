"use client";

export function useQuotaEstimate() {
  const SEARCH_COST = 100;
  const PLAYLIST_CREATE_COST = 50;
  const PLAYLIST_ITEM_COST = 50;

  function estimateSearch(): number {
    return SEARCH_COST;
  }

  function estimatePlaylistCreate(songCount: number): number {
    return PLAYLIST_CREATE_COST + songCount * PLAYLIST_ITEM_COST;
  }

  return { estimateSearch, estimatePlaylistCreate, SEARCH_COST };
}
