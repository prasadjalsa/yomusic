import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { youtubePlaylistUrl, youtubeVideoUrl } from "@/lib/utils";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: playlist, error: plError } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (plError || !playlist) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: items } = await supabase
    .from("playlist_items")
    .select("*")
    .eq("playlist_id", id)
    .eq("user_id", user.id)
    .order("position", { ascending: true })
    .range(0, 999);

  return NextResponse.json({
    playlist: {
      id: playlist.id,
      youtubeId: playlist.youtube_id,
      title: playlist.title,
      description: playlist.description,
      videoCount: playlist.video_count,
      createdAt: playlist.created_at,
      youtubeUrl: youtubePlaylistUrl(playlist.youtube_id),
      items: (items ?? []).map((item) => ({
        youtubeVideoId: item.youtube_video_id,
        title: item.title,
        channelTitle: item.channel_title,
        thumbnailUrl: item.thumbnail_url,
        position: item.position,
        youtubeUrl: youtubeVideoUrl(item.youtube_video_id),
      })),
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}


export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: playlist, error: plError } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (plError || !playlist) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("playlist_items")
    .select("*")
    .eq("playlist_id", id)
    .order("position", { ascending: true });

  return NextResponse.json({
    playlist: {
      id: playlist.id,
      youtubeId: playlist.youtube_id,
      title: playlist.title,
      description: playlist.description,
      videoCount: playlist.video_count,
      createdAt: playlist.created_at,
      youtubeUrl: youtubePlaylistUrl(playlist.youtube_id),
      items: (items ?? []).map((item) => ({
        youtubeVideoId: item.youtube_video_id,
        title: item.title,
        channelTitle: item.channel_title,
        thumbnailUrl: item.thumbnail_url,
        position: item.position,
        youtubeUrl: youtubeVideoUrl(item.youtube_video_id),
      })),
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
