export interface VideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
}

export interface SearchResponse {
  videos: VideoResult[];
  nextPageToken: string | null;
  totalResults: number;
  quotaUsed: number;
}

export interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

export interface YouTubeSearchApiResponse {
  items: YouTubeSearchItem[];
  nextPageToken?: string;
  pageInfo: { totalResults: number };
}

export class YouTubeAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeAuthError";
  }
}
