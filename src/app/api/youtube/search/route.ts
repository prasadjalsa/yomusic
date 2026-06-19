import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildQueryCombinations,
  buildSearchParams,
  transformSearchResults,
} from "@/lib/youtube/search";
import { checkAndIncrementQuota } from "@/lib/youtube/quota";
import type { SearchFilters } from "@/types/filters";
import type { VideoResult, YouTubeSearchApiResponse } from "@/types/youtube";

// Returns true if the video title/channel contains at least one of the given names.
function titleMatchesAny(video: VideoResult, names: string[]): boolean {
  if (names.length === 0) return true;
  const haystack = (video.title + " " + video.channelTitle).toLowerCase();
  return names.some((n) => haystack.includes(n.toLowerCase()));
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const filters: SearchFilters = body.filters;

  if (!filters) {
    return NextResponse.json({ error: "filters required" }, { status: 400 });
  }

  const queries = buildQueryCombinations(filters);
  const quotaCost = queries.length * 100;
  const cappedAt5 =
    queries.length === 5 &&
    (filters.directorMode === "OR" || filters.singerMode === "OR");

  const { allowed, remaining } = await checkAndIncrementQuota(user.id, quotaCost);
  if (!allowed) {
    return NextResponse.json(
      { error: "quota_exceeded", message: "Daily search limit reached. Try again tomorrow." },
      { status: 429 }
    );
  }

  const seen = new Set<string>();
  const relevant: VideoResult[] = [];   // title matches searched names
  const fallback: VideoResult[] = [];   // YouTube returned but name not in title

  // All searched person names for title matching
  const allNames = [...filters.musicDirectors, ...filters.singers];

  for (const query of queries) {
    if (!query.trim()) continue;

    const params = buildSearchParams(
      query,
      filters.count,
      filters.yearFrom,
      filters.yearTo
    );

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);

    const ytRes = await fetch(url.toString());
    if (!ytRes.ok) {
      const err = await ytRes.json().catch(() => ({}));
      console.error("YouTube search error:", err);
      continue;
    }

    const data: YouTubeSearchApiResponse = await ytRes.json();
    const videos = transformSearchResults(data);

    for (const v of videos) {
      if (seen.has(v.videoId)) continue;
      seen.add(v.videoId);

      if (titleMatchesAny(v, allNames)) {
        relevant.push(v);
      } else {
        fallback.push(v);
      }
    }
  }

  // Prefer relevant results; fill remainder with fallback if needed
  const combined = [...relevant, ...fallback];
  const results = combined.slice(0, filters.count); // never exceed requested count

  await supabase.from("search_history").insert({
    user_id: user.id,
    filters,
    query_string: queries.join(" | "),
    result_count: results.length,
    quota_used: quotaCost,
  });

  return NextResponse.json({
    videos: results,
    totalResults: results.length,
    quotaUsed: quotaCost,
    remainingQuota: remaining,
    combinationsRun: queries.length,
    cappedAt5,
  });
}

