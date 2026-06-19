import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import YouTubeTokenGuard from "@/components/auth/YouTubeTokenGuard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 pb-48">
        <div className="space-y-4">
          <YouTubeTokenGuard />
          {children}
        </div>
      </main>
    </div>
  );
}
