"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";

export default function YouTubeTokenGuard() {
  const [refreshing, setRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function ensureToken() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;
      if (session.provider_token) return; // token present, nothing to do

      setRefreshing(true);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/youtube",
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
    }
    ensureToken();
  }, []);

  if (!refreshing || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5 rounded-lg">
      <span>Refreshing YouTube access — you'll be redirected back in a moment…</span>
      <button onClick={() => setDismissed(true)} className="shrink-0 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
