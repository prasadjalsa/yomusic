import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { PlayerProvider } from "@/context/PlayerContext";
import MiniPlayerWrapper from "@/components/player/MiniPlayerWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yomusicly — Indian Film Music Playlists",
  description: "Search Indian film music and create YouTube playlists by music director, singer, movie, and year.",
  applicationName: "Yomusicly",
  appleWebApp: {
    capable: true,
    title: "Yomusicly",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  themeColor: "#7c3aed",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* YouTube IFrame API — loaded lazily, global singleton */}
        <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
        <PlayerProvider>
          {children}
          <MiniPlayerWrapper />
        </PlayerProvider>
      </body>
    </html>
  );
}
