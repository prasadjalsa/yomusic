import { YouTubeAuthError } from "@/types/youtube";

export { YouTubeAuthError };

const YT_BASE = "https://www.googleapis.com/youtube/v3";

async function ytFetch(
  path: string,
  options: RequestInit,
  token: string
): Promise<Response> {
  const res = await fetch(`${YT_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 401) {
    throw new YouTubeAuthError("provider_token_expired");
  }
  return res;
}

export async function createYouTubePlaylist(
  token: string,
  title: string,
  description: string
): Promise<string> {
  const res = await ytFetch(
    "/playlists?part=snippet,status",
    {
      method: "POST",
      body: JSON.stringify({
        snippet: { title, description },
        status: { privacyStatus: "public" },
      }),
    },
    token
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Failed to create playlist: ${err?.error?.message ?? res.statusText}`
    );
  }

  const data = await res.json();
  return data.id as string;
}

export async function insertVideosIntoPlaylist(
  token: string,
  playlistId: string,
  videoIds: string[]
): Promise<void> {
  // Insert in batches to stay within Vercel function timeout
  const BATCH = 25;
  for (let i = 0; i < videoIds.length; i += BATCH) {
    const batch = videoIds.slice(i, i + BATCH);
    for (let pos = 0; pos < batch.length; pos++) {
      const res = await ytFetch(
        "/playlistItems?part=snippet",
        {
          method: "POST",
          body: JSON.stringify({
            snippet: {
              playlistId,
              position: i + pos,
              resourceId: { kind: "youtube#video", videoId: batch[pos] },
            },
          }),
        },
        token
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Log but continue — partial playlists are still useful
        console.error(
          `Failed to insert video ${batch[pos]}: ${err?.error?.message ?? res.statusText}`
        );
      }
    }
  }
}
