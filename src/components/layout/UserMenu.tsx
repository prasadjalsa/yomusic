"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import Image from "next/image";

export default function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  if (!user) return null;

  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const name = user.user_metadata?.full_name as string | undefined;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {avatar ? (
          <Image
            src={avatar}
            alt={name ?? "User"}
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <User className="h-5 w-5 text-muted-foreground" />
        )}
        <span className="text-sm hidden sm:block text-muted-foreground">
          {name ?? user.email}
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={signOut} title="Sign out">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
