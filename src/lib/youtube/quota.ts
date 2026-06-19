import { createClient } from "@/lib/supabase/server";

function getDailyBudget(): number {
  return parseInt(process.env.DAILY_QUOTA_PER_USER ?? "10000", 10);
}

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
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const budget = getDailyBudget();

  // Atomic check-and-increment — single DB round trip, no race condition
  const { data, error } = await supabase.rpc("check_and_increment_quota", {
    p_user_id: userId,
    p_date: today,
    p_units: unitsToConsume,
    p_budget: budget,
  });

  if (error) {
    // RPC not available — fall back to non-atomic increment
    console.error("check_and_increment_quota RPC error:", error.message);
    const used = await getTodayUsage(userId);
    const remaining = Math.max(0, budget - used);
    if (unitsToConsume > remaining) return { allowed: false, remaining };

    await supabase.from("quota_usage").upsert(
      { user_id: userId, date: today, units_consumed: used + unitsToConsume },
      { onConflict: "user_id,date" }
    );
    return { allowed: true, remaining: remaining - unitsToConsume };
  }

  return {
    allowed: data.allowed as boolean,
    remaining: data.remaining as number,
  };
}
