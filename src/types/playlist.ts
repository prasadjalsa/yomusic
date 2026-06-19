export interface Playlist {
  id: string;
  youtubeId: string;
  title: string;
  description: string | null;
  videoCount: number;
  createdAt: string;
  youtubeUrl: string;
}

export interface PlaylistItem {
  youtubeVideoId: string;
  title: string;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  position: number;
  youtubeUrl: string;
}

export interface PlaylistDetail extends Playlist {
  items: PlaylistItem[];
}

export interface CreatePlaylistRequest {
  title: string;
  description: string;
  videoIds: string[];
}

export interface CreatePlaylistResponse {
  playlist: Playlist;
}
