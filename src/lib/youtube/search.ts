import type { SearchFilters, FilterMode } from "@/types/filters";
import type { VideoResult, YouTubeSearchApiResponse } from "@/types/youtube";

const LANG_TERMS: Record<string, string> = {
  Tamil: "Tamil song",
  Hindi: "Hindi song",
  Telugu: "Telugu song",
  Kannada: "Kannada song",
  Malayalam: "Malayalam song",
};

function buildSingleQuery(
  directors: string[],
  singers: string[],
  movieName: string,
  language: string | null
): string {
  const parts: string[] = [];
  if (movieName) parts.push(`"${movieName}"`);
  directors.forEach((d) => parts.push(`"${d}"`));
  singers.forEach((s) => parts.push(`"${s}"`));
  if (language) parts.push(LANG_TERMS[language] ?? language);
  return parts.join(" ");
}

// Returns one query string per OR combination, capped at MAX_COMBINATIONS.
export function buildQueryCombinations(filters: SearchFilters): string[] {
  const directors =
    filters.musicDirectors.length > 0 ? filters.musicDirectors : [null];
  const singers =
    filters.singers.length > 0 ? filters.singers : [null];

  const dirGroups: Array<string[]> =
    filters.directorMode === "OR"
      ? directors.map((d) => (d ? [d] : []))
      : [filters.musicDirectors];

  const singerGroups: Array<string[]> =
    filters.singerMode === "OR"
      ? singers.map((s) => (s ? [s] : []))
      : [filters.singers];

  const combinations: string[] = [];

  for (const dg of dirGroups) {
    for (const sg of singerGroups) {
      combinations.push(
        buildSingleQuery(dg, sg, filters.movieName, filters.language)
      );
      if (combinations.length >= 5) return combinations;
    }
  }

  return combinations.length > 0
    ? combinations
    : [buildSingleQuery([], [], filters.movieName, filters.language)];
}

export function buildSearchParams(
  query: string,
  count: number,
  yearFrom: number | null,
  yearTo: number | null,
  pageToken?: string
): Record<string, string> {
  const params: Record<string, string> = {
    part: "snippet",
    type: "video",
    videoCategoryId: "10",
    maxResults: String(count),
    q: query,
  };
  if (yearFrom) params.publishedAfter = `${yearFrom}-01-01T00:00:00Z`;
  if (yearTo) params.publishedBefore = `${yearTo}-12-31T23:59:59Z`;
  if (pageToken) params.pageToken = pageToken;
  return params;
}

export function transformSearchResults(
  data: YouTubeSearchApiResponse
): VideoResult[] {
  return data.items.map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl:
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default?.url ??
      "",
    publishedAt: item.snippet.publishedAt,
  }));
}
