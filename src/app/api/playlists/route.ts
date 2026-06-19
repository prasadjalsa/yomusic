import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createYouTubePlaylist, insertVideosIntoPlaylist, YouTubeAuthError } from "@/lib/youtube/playlist";
import { checkAndIncrementQuota } from "@/lib/youtube/quota";
import { youtubePlaylistUrl } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // provider_token is not available server-side via cookies — client sends it in the header
  const providerToken = request.headers.get("x-provider-token");
  if (!providerToken) {
    return NextResponse.json({ error: "youtube_auth_expired" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, videoIds, videoMeta } = body as {
    title: string;
    description: string;
    videoIds: string[];
    videoMeta?: Array<{ videoId: string; title: string; channelTitle: string; thumbnailUrl: string }>;
  };

  if (!title || !Array.isArray(videoIds) || videoIds.length === 0) {
    return NextResponse.json({ error: "title and videoIds required" }, { status: 400 });
  }

  // Quota: 50 (create) + 50 * N (insertions)
  const quotaCost = 50 + videoIds.length * 50;
  const { allowed } = await checkAndIncrementQuota(user.id, quotaCost);
  if (!allowed) {
    return NextResponse.json(
      { error: "quota_exceeded", message: "Daily quota limit reached." },
      { status: 429 }
    );
  }

  try {
    const youtubeId = await createYouTubePlaylist(providerToken, title, description ?? "");
    await insertVideosIntoPlaylist(providerToken, youtubeId, videoIds);

    // Persist to Supabase
    const { data: playlist, error: dbError } = await supabase
      .from("playlists")
      .insert({
        user_id: user.id,
        youtube_id: youtubeId,
        title,
        description: description ?? null,
        video_count: videoIds.length,
      })
      .select()
      .single();

    if (dbError || !playlist) {
      console.error("DB insert error:", dbError);
      // Playlist was created on YouTube — still return success
      return NextResponse.json({
        playlist: {
          id: null,
          youtubeId,
          title,
          videoCount: videoIds.length,
          createdAt: new Date().toISOString(),
          youtubeUrl: youtubePlaylistUrl(youtubeId),
        },
      }, { status: 201 });
    }

    // Persist individual items with rich metadata if available
    if (videoIds.length > 0) {
      const metaMap = new Map(
        (videoMeta ?? []).map((m) => [m.videoId, m])
      );
      await supabase.from("playlist_items").insert(
        videoIds.map((vid, pos) => {
          const meta = metaMap.get(vid);
          return {
            playlist_id: playlist.id,
            user_id: user.id,
            youtube_video_id: vid,
            title: meta?.title ?? vid,
            channel_title: meta?.channelTitle ?? null,
            thumbnail_url: meta?.thumbnailUrl ?? null,
            position: pos,
          };
        })
      );
    }

    return NextResponse.json({
      playlist: {
        id: playlist.id,
        youtubeId: playlist.youtube_id,
        title: playlist.title,
        videoCount: playlist.video_count,
        createdAt: playlist.created_at,
        youtubeUrl: youtubePlaylistUrl(playlist.youtube_id),
      },
    }, { status: 201 });

  } catch (err) {
    if (err instanceof YouTubeAuthError) {
      return NextResponse.json({ error: "youtube_auth_expired", message: "YouTube session expired. Please sign in again." }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Playlist creation error:", message);
    return NextResponse.json({ error: "playlist_failed", message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const from = (page - 1) * limit;

  const { data: playlists, count, error } = await supabase
    .from("playlists")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
  }

  return NextResponse.json({
    playlists: (playlists ?? []).map((pl) => ({
      id: pl.id,
      youtubeId: pl.youtube_id,
      title: pl.title,
      description: pl.description,
      videoCount: pl.video_count,
      createdAt: pl.created_at,
      youtubeUrl: youtubePlaylistUrl(pl.youtube_id),
    })),
    total: count ?? 0,
    page,
    hasMore: from + limit < (count ?? 0),
  });
}
