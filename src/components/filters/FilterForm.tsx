"use client";

import { type SearchFilters, DEFAULT_FILTERS, SONG_COUNT_OPTIONS, LANGUAGE_OPTIONS, type SongCount } from "@/types/filters";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";
import FilterChip from "./FilterChip";
import { useState } from "react";

interface FilterFormProps {
  onSearch: (filters: SearchFilters) => void;
  loading: boolean;
}

export default function FilterForm({ onSearch, loading }: FilterFormProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  function update<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const activeChips: Array<{ label: string; key: keyof SearchFilters }> = [
    filters.language ? { label: filters.language, key: "language" } : null,
    filters.musicDirector ? { label: `Director: ${filters.musicDirector}`, key: "musicDirector" } : null,
    filters.singer ? { label: `Singer: ${filters.singer}`, key: "singer" } : null,
    filters.movieName ? { label: `Movie: ${filters.movieName}`, key: "movieName" } : null,
    filters.yearFrom ? { label: `From: ${filters.yearFrom}`, key: "yearFrom" } : null,
    filters.yearTo ? { label: `To: ${filters.yearTo}`, key: "yearTo" } : null,
  ].filter(Boolean) as Array<{ label: string; key: keyof SearchFilters }>;

  function removeChip(key: keyof SearchFilters) {
    if (key === "language") update("language", null);
    else if (key === "musicDirector") update("musicDirector", "");
    else if (key === "singer") update("singer", "");
    else if (key === "movieName") update("movieName", "");
    else if (key === "yearFrom") update("yearFrom", null);
    else if (key === "yearTo") update("yearTo", null);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="language">Language</Label>
          <Select
            value={filters.language ?? ""}
            onValueChange={(v) => update("language", v as typeof filters.language)}
          >
            <SelectTrigger id="language">
              <SelectValue placeholder="Any language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="musicDirector">Music Director</Label>
          <Input
            id="musicDirector"
            placeholder="e.g. G V Prakash"
            value={filters.musicDirector}
            onChange={(e) => update("musicDirector", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="singer">Singer</Label>
          <Input
            id="singer"
            placeholder="e.g. Chitra"
            value={filters.singer}
            onChange={(e) => update("singer", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="movieName">Movie Name</Label>
          <Input
            id="movieName"
            placeholder="e.g. Enthiran"
            value={filters.movieName}
            onChange={(e) => update("movieName", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Year Range</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="From"
              min={1950}
              max={2030}
              value={filters.yearFrom ?? ""}
              onChange={(e) => update("yearFrom", e.target.value ? parseInt(e.target.value) : null)}
              className="w-full"
            />
            <Input
              type="number"
              placeholder="To"
              min={1950}
              max={2030}
              value={filters.yearTo ?? ""}
              onChange={(e) => update("yearTo", e.target.value ? parseInt(e.target.value) : null)}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="count">Songs to Fetch</Label>
          <Select
            value={String(filters.count)}
            onValueChange={(v) => update("count", parseInt(v) as SongCount)}
          >
            <SelectTrigger id="count">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SONG_COUNT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} songs</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onRemove={() => removeChip(chip.key)}
            />
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={() => onSearch(filters)}
          disabled={loading || (!filters.musicDirector && !filters.singer && !filters.movieName && !filters.language)}
          className="flex-1 sm:flex-none"
        >
          <Search className="h-4 w-4 mr-2" />
          {loading ? "Searching…" : "Search Songs"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setFilters(DEFAULT_FILTERS)}
          disabled={loading}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
