"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export default function QuotaBadge() {
  const [used, setUsed] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("quota_usage")
        .select("units_consumed")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      setUsed(data?.units_consumed ?? 0);
    }
    load();
  }, [supabase]);

  if (used === null) return null;

  const pct = used / 10000;
  const variant = pct > 0.8 ? "destructive" : pct > 0.5 ? "secondary" : "outline";

  return (
    <Badge variant={variant} className="gap-1 text-xs">
      <Zap className="h-3 w-3" />
      {used.toLocaleString()} / 10,000 units
    </Badge>
  );
}
