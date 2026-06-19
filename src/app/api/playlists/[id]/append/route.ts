import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertVideosIntoPlaylist, YouTubeAuthError } from "@/lib/youtube/playlist";
import { checkAndIncrementQuota } from "@/lib/youtube/quota";

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateVideoIds(ids: unknown): ids is string[] {
  return Array.isArray(ids) &&
    ids.length > 0 &&
    ids.length <= 50 &&
    ids.every((id) => typeof id === "string" && YOUTUBE_ID_RE.test(id));
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Validate playlist ID is a UUID
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { videoIds, videoMeta } = body as {
    videoIds: unknown;
    videoMeta?: Array<{ videoId: string; title: string; channelTitle: string; thumbnailUrl: string }>;
  };

  if (!validateVideoIds(videoIds)) {
    return NextResponse.json({ error: "videoIds must be 1–50 valid YouTube video IDs" }, { status: 400 });
  }

  // Load existing video IDs to deduplicate
  const { data: existing } = await supabase
    .from("playlist_items")
    .select("youtube_video_id")
    .eq("playlist_id", id)
    .eq("user_id", user.id);

  const existingSet = new Set((existing ?? []).map((r) => r.youtube_video_id));
  const newVideoIds = videoIds.filter((v) => !existingSet.has(v));

  if (newVideoIds.length === 0) {
    return NextResponse.json({ error: "All selected songs are already in this playlist." }, { status: 400 });
  }

  const quotaCost = newVideoIds.length * 50;
  const { allowed } = await checkAndIncrementQuota(user.id, quotaCost);
  if (!allowed) {
    return NextResponse.json({ error: "quota_exceeded", message: "Daily quota limit reached." }, { status: 429 });
  }

  try {
    await insertVideosIntoPlaylist(providerToken, playlist.youtube_id, newVideoIds);

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
    console.error("Append error:", err);
    return NextResponse.json({ error: "append_failed", message: "Failed to add songs. Please try again." }, { status: 500 });
  }
}
