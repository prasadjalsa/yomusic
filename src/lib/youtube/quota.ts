import { createClient } from "@/lib/supabase/server";

const DAILY_BUDGET = parseInt(
  process.env.DAILY_QUOTA_PER_USER ?? "2000",
  10
);

export async function getTodayUsage(userId: string): Promise<number> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("quota_usage")
    .select("units_consumed")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  return data?.units_consumed ?? 0;
}

export async function checkAndIncrementQuota(
  userId: string,
  unitsToConsume: number
): Promise<{ allowed: boolean; remaining: number }> {
  const used = await getTodayUsage(userId);
  const remaining = Math.max(0, DAILY_BUDGET - used);

  if (unitsToConsume > remaining) {
    return { allowed: false, remaining };
  }

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  await supabase.from("quota_usage").upsert(
    {
      user_id: userId,
      date: today,
      units_consumed: used + unitsToConsume,
    },
    { onConflict: "user_id,date" }
  );

  return { allowed: true, remaining: remaining - unitsToConsume };
}
