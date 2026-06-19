import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertVideosIntoPlaylist, YouTubeAuthError } from "@/lib/youtube/playlist";
import { checkAndIncrementQuota } from "@/lib/youtube/quota";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const providerToken = request.headers.get("x-provider-token");
  if (!providerToken) return NextResponse.json({ error: "youtube_auth_expired" }, { status: 401 });

  // Verify playlist ownership
  const { data: playlist, error: plError } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (plError || !playlist) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await request.json();
  const { videoIds, videoMeta } = body as {
    videoIds: string[];
    videoMeta?: Array<{ videoId: string; title: string; channelTitle: string; thumbnailUrl: string }>;
  };

  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    return NextResponse.json({ error: "videoIds required" }, { status: 400 });
  }

  // Load existing video IDs to deduplicate
  const { data: existing } = await supabase
    .from("playlist_items")
    .select("youtube_video_id")
    .eq("playlist_id", id);

  const existingSet = new Set((existing ?? []).map((r) => r.youtube_video_id));
  const newVideoIds = videoIds.filter((v) => !existingSet.has(v));

  if (newVideoIds.length === 0) {
    return NextResponse.json({ error: "All selected songs are already in this playlist." }, { status: 400 });
  }

  // Quota: 50 per insertion
  const quotaCost = newVideoIds.length * 50;
  const { allowed } = await checkAndIncrementQuota(user.id, quotaCost);
  if (!allowed) {
    return NextResponse.json({ error: "quota_exceeded", message: "Daily quota limit reached." }, { status: 429 });
  }

  try {
    await insertVideosIntoPlaylist(providerToken, playlist.youtube_id, newVideoIds);

    // Persist new items
    const startPosition = playlist.video_count;
    const metaMap = new Map((videoMeta ?? []).map((m) => [m.videoId, m]));

    await supabase.from("playlist_items").insert(
      newVideoIds.map((vid, i) => {
        const meta = metaMap.get(vid);
        return {
          playlist_id: id,
          user_id: user.id,
          youtube_video_id: vid,
          title: meta?.title ?? vid,
          channel_title: meta?.channelTitle ?? null,
          thumbnail_url: meta?.thumbnailUrl ?? null,
          position: startPosition + i,
        };
      })
    );

    // Update video_count
    await supabase
      .from("playlists")
      .update({ video_count: playlist.video_count + newVideoIds.length })
      .eq("id", id);

    return NextResponse.json({
      added: newVideoIds.length,
      totalCount: playlist.video_count + newVideoIds.length,
    }, { status: 200 });

  } catch (err) {
    if (err instanceof YouTubeAuthError) {
      return NextResponse.json({ error: "youtube_auth_expired", message: "YouTube session expired. Please sign in again." }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "append_failed", message }, { status: 500 });
  }
}
