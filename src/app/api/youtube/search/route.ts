import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSearchParams, transformSearchResults } from "@/lib/youtube/search";
import { checkAndIncrementQuota } from "@/lib/youtube/quota";
import type { SearchFilters } from "@/types/filters";
import type { YouTubeSearchApiResponse } from "@/types/youtube";

const QUOTA_PER_SEARCH = 100;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const filters: SearchFilters = body.filters;

  if (!filters) {
    return NextResponse.json({ error: "filters required" }, { status: 400 });
  }

  // Check quota before hitting YouTube
  const { allowed, remaining } = await checkAndIncrementQuota(user.id, QUOTA_PER_SEARCH);
  if (!allowed) {
    return NextResponse.json(
      { error: "quota_exceeded", message: "Daily search limit reached. Try again tomorrow." },
      { status: 429 }
    );
  }

  const params = buildSearchParams(filters);
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);

  const ytRes = await fetch(url.toString());

  if (!ytRes.ok) {
    const err = await ytRes.json().catch(() => ({}));
    console.error("YouTube search error:", err);
    return NextResponse.json(
      { error: "youtube_error", message: err?.error?.message ?? "YouTube search failed" },
      { status: 502 }
    );
  }

  const data: YouTubeSearchApiResponse = await ytRes.json();
  const videos = transformSearchResults(data);

  // Log search to history
  await supabase.from("search_history").insert({
    user_id: user.id,
    filters,
    query_string: params.q,
    result_count: videos.length,
    quota_used: QUOTA_PER_SEARCH,
  });

  return NextResponse.json({
    videos,
    nextPageToken: data.nextPageToken ?? null,
    totalResults: data.pageInfo.totalResults,
    quotaUsed: QUOTA_PER_SEARCH,
    remainingQuota: remaining,
  });
}
