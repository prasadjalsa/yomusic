export type Language = "Tamil" | "Hindi" | "Telugu" | "Kannada" | "Malayalam";

export type SongCount = 5 | 10 | 15 | 20 | 25 | 50;

export interface SearchFilters {
  language: Language | null;
  musicDirector: string;
  singer: string;
  movieName: string;
  yearFrom: number | null;
  yearTo: number | null;
  count: SongCount;
}

export const DEFAULT_FILTERS: SearchFilters = {
  language: "Tamil",
  musicDirector: "",
  singer: "",
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
