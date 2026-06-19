export type Language = "Tamil" | "Hindi" | "Telugu" | "Kannada" | "Malayalam";

export type SongCount = 5 | 10 | 15 | 20 | 25 | 50;

export type FilterMode = "AND" | "OR";

export interface SearchFilters {
  language: Language | null;
  musicDirectors: string[];
  singers: string[];
  directorMode: FilterMode;
  singerMode: FilterMode;
  movieName: string;
  yearFrom: number | null;
  yearTo: number | null;
  count: SongCount;
}

export const DEFAULT_FILTERS: SearchFilters = {
  language: "Tamil",
  musicDirectors: [],
  singers: [],
  directorMode: "AND",
  singerMode: "AND",
  movieName: "",
  yearFrom: null,
  yearTo: null,
  count: 10,
};

export const SONG_COUNT_OPTIONS: SongCount[] = [5, 10, 15, 20, 25, 50];

export const LANGUAGE_OPTIONS: Language[] = [
  "Tamil",
  "Hindi",
  "Telugu",
  "Kannada",
  "Malayalam",
];

export const MAX_COMBINATIONS = 5;
