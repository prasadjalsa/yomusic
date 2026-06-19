import type { SearchFilters } from "@/types/filters";
import type {
  VideoResult,
  YouTubeSearchApiResponse,
} from "@/types/youtube";

const LANG_TERMS: Record<string, string> = {
  Tamil: "Tamil song",
  Hindi: "Hindi song",
  Telugu: "Telugu song",
  Kannada: "Kannada song",
  Malayalam: "Malayalam song",
};

export function buildSearchQuery(filters: SearchFilters): string {
  const parts: string[] = [];
  if (filters.movieName) parts.push(`"${filters.movieName}"`);
  if (filters.singer) parts.push(filters.singer);
  if (filters.musicDirector) parts.push(filters.musicDirector);
  if (filters.language) {
    parts.push(LANG_TERMS[filters.language] ?? filters.language);
  }
  return parts.join(" ");
}

export function buildSearchParams(
  filters: SearchFilters,
  pageToken?: string
): Record<string, string> {
  const params: Record<string, string> = {
    part: "snippet",
    type: "video",
    videoCategoryId: "10", // Music category
    maxResults: String(filters.count),
    q: buildSearchQuery(filters),
  };

  if (filters.yearFrom) {
    params.publishedAfter = `${filters.yearFrom}-01-01T00:00:00Z`;
  }
  if (filters.yearTo) {
    params.publishedBefore = `${filters.yearTo}-12-31T23:59:59Z`;
  }
  if (pageToken) {
    params.pageToken = pageToken;
  }

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
