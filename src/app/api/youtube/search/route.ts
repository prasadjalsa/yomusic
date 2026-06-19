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

const MAX_TAG_LENGTH = 100;
const MAX_TAGS = 10;
const MAX_MOVIE_LENGTH = 200;

function validateFilters(filters: unknown): filters is SearchFilters {
  if (!filters || typeof filters !== "object") return false;
  const f = filters as Record<string, unknown>;

  // Validate arrays of strings with length limits
  for (const key of ["musicDirectors", "singers", "lyricists", "starring"]) {
    if (!Array.isArray(f[key])) return false;
    if ((f[key] as unknown[]).length > MAX_TAGS) return false;
    if ((f[key] as unknown[]).some((v) => typeof v !== "string" || v.length > MAX_TAG_LENGTH)) return false;
  }

  if (typeof f.movieName !== "string" || f.movieName.length > MAX_MOVIE_LENGTH) return false;
  if (typeof f.count !== "number" || ![5, 10, 15, 20, 25, 50].includes(f.count)) return false;

  return true;
}

function titleMatchesAny(video: VideoResult, names: string[]): boolean {
  if (names.length === 0) return true;
  const haystack = (video.title + " " + video.channelTitle).toLowerCase();
  return names.some((n) => haystack.includes(n.toLowerCase()));
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const filters = (body as Record<string, unknown>)?.filters;
  if (!validateFilters(filters)) {
    return NextResponse.json({ error: "Invalid or missing filters" }, { status: 400 });
  }

  const queries = buildQueryCombinations(filters);
  const quotaCost = queries.length * 100;
  const cappedAt5 = queries.length === 5 &&
    (filters.directorMode === "OR" || filters.singerMode === "OR");

  const { allowed, remaining } = await checkAndIncrementQuota(user.id, quotaCost);
  if (!allowed) {
    return NextResponse.json(
      { error: "quota_exceeded", message: "Daily search limit reached. Try again tomorrow." },
      { status: 429 }
    );
  }

  const seen = new Set<string>();
  const relevant: VideoResult[] = [];
  const fallback: VideoResult[] = [];
  const allNames = [...filters.musicDirectors, ...filters.singers, ...filters.lyricists, ...filters.starring];

  for (const query of queries) {
    if (!query.trim()) continue;

    const params = buildSearchParams(query, filters.count, filters.yearFrom, filters.yearTo);
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);

    const ytRes = await fetch(url.toString());
    if (!ytRes.ok) {
      console.error("YouTube search error:", ytRes.status);
      continue;
    }

    const data: YouTubeSearchApiResponse = await ytRes.json();
    for (const v of transformSearchResults(data)) {
      if (seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      if (titleMatchesAny(v, allNames)) relevant.push(v);
      else fallback.push(v);
    }
  }

  const results = [...relevant, ...fallback].slice(0, filters.count);

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
