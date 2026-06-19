"use client";

import { useState } from "react";
import {
  type SearchFilters,
  DEFAULT_FILTERS,
  SONG_COUNT_OPTIONS,
  LANGUAGE_OPTIONS,
  type SongCount,
  type FilterMode,
  MAX_COMBINATIONS,
} from "@/types/filters";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw, AlertTriangle } from "lucide-react";
import FilterChip from "./FilterChip";
import TagInput from "./TagInput";
import { buildQueryCombinations } from "@/lib/youtube/search";

interface FilterFormProps {
  onSearch: (filters: SearchFilters) => void;
  loading: boolean;
}

export default function FilterForm({ onSearch, loading }: FilterFormProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  function update<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const combinations = buildQueryCombinations(filters);
  const isCapped = combinations.length === MAX_COMBINATIONS &&
    (filters.directorMode === "OR" || filters.singerMode === "OR");

  const hasFilters =
    filters.musicDirectors.length > 0 ||
    filters.singers.length > 0 ||
    filters.lyricists.length > 0 ||
    filters.starring.length > 0 ||
    !!filters.movieName ||
    !!filters.language;

  const activeChips: Array<{ label: string; onRemove: () => void }> = [
    filters.language
      ? { label: filters.language, onRemove: () => update("language", null) }
      : null,
    filters.movieName
      ? { label: `Movie: ${filters.movieName}`, onRemove: () => update("movieName", "") }
      : null,
    filters.yearFrom
      ? { label: `From: ${filters.yearFrom}`, onRemove: () => update("yearFrom", null) }
      : null,
    filters.yearTo
      ? { label: `To: ${filters.yearTo}`, onRemove: () => update("yearTo", null) }
      : null,
  ].filter(Boolean) as Array<{ label: string; onRemove: () => void }>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Language */}
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

        {/* Song Count */}
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

        {/* Music Directors — full width */}
        <div className="sm:col-span-2">
          <TagInput
            label="Music Director(s)"
            placeholder="e.g. G V Prakash — press Enter to add"
            tags={filters.musicDirectors}
            mode={filters.directorMode}
            onTagsChange={(tags) => update("musicDirectors", tags)}
            onModeChange={(mode) => update("directorMode", mode as FilterMode)}
          />
        </div>

        {/* Singers — full width */}
        <div className="sm:col-span-2">
          <TagInput
            label="Singer(s)"
            placeholder="e.g. Chitra — press Enter to add"
            tags={filters.singers}
            mode={filters.singerMode}
            onTagsChange={(tags) => update("singers", tags)}
            onModeChange={(mode) => update("singerMode", mode as FilterMode)}
          />
        </div>

        {/* Lyricists — full width */}
        <div className="sm:col-span-2">
          <TagInput
            label="Lyricist(s)"
            placeholder="e.g. Vairamuthu — press Enter to add"
            tags={filters.lyricists}
            mode={filters.lyricistMode}
            onTagsChange={(tags) => update("lyricists", tags)}
            onModeChange={(mode) => update("lyricistMode", mode as FilterMode)}
          />
        </div>

        {/* Starring — full width */}
        <div className="sm:col-span-2">
          <TagInput
            label="Starring"
            placeholder="e.g. Rajinikanth — press Enter to add"
            tags={filters.starring}
            mode={filters.starringMode}
            onTagsChange={(tags) => update("starring", tags)}
            onModeChange={(mode) => update("starringMode", mode as FilterMode)}
          />
        </div>

        {/* Movie Name */}
        <div className="space-y-1.5">
          <Label htmlFor="movieName">Movie Name</Label>
          <Input
            id="movieName"
            placeholder="e.g. Enthiran"
            value={filters.movieName}
            onChange={(e) => update("movieName", e.target.value)}
          />
        </div>

        {/* Year Range */}
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
            />
            <Input
              type="number"
              placeholder="To"
              min={1950}
              max={2030}
              value={filters.yearTo ?? ""}
              onChange={(e) => update("yearTo", e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip, i) => (
            <FilterChip key={i} label={chip.label} onRemove={chip.onRemove} />
          ))}
        </div>
      )}

      {/* Combinations info */}
      {combinations.length > 1 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          {isCapped ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Capped at 5 search combinations ({combinations.length * 100} quota units). Reduce OR filters to see more.</span>
            </>
          ) : (
            <span>{combinations.length} search combinations will run ({combinations.length * 100} quota units).</span>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={() => onSearch(filters)}
          disabled={loading || !hasFilters}
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
