import { createClient } from "@/lib/supabase/server";

function getDailyBudget(): number {
  // Read at call time so Vercel env var changes take effect after redeploy
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

  const used = await getTodayUsage(userId);
  const remaining = Math.max(0, budget - used);

  if (unitsToConsume > remaining) {
    return { allowed: false, remaining };
  }

  // Use raw SQL increment to avoid race conditions between concurrent requests
  await supabase.rpc("increment_quota_usage", {
    p_user_id: userId,
    p_date: today,
    p_units: unitsToConsume,
  });

  return { allowed: true, remaining: remaining - unitsToConsume };
}
