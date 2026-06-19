"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Music2 } from "lucide-react";

export default function AuthPage() {
  const supabase = createClient();

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/youtube",
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="flex items-center justify-center gap-3">
          <Music2 className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Yomusicly</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Search Indian film music by director, singer, or movie — and create YouTube playlists in one click.
        </p>
        <div className="space-y-2">
          <Button onClick={signIn} size="lg" className="w-full">
            Continue with Google
          </Button>
          <p className="text-xs text-muted-foreground">
            Sign in with your Google account to create playlists on your YouTube channel.
          </p>
        </div>
      </div>
    </div>
  );
}
