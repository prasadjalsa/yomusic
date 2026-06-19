"use client";

import Link from "next/link";
import { Music2 } from "lucide-react";
import UserMenu from "./UserMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 mx-auto max-w-6xl">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Music2 className="h-5 w-5 text-primary" />
          Yomusicly
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Search
          </Link>
          <Link
            href="/dashboard/playlists"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            My Playlists
          </Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
