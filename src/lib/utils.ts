import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function youtubeVideoUrl(videoId: string): string {
  // Use music.youtube.com to avoid OS intercepting the link and opening the native app
  return `https://music.youtube.com/watch?v=${videoId}`;
}

export function youtubePlaylistUrl(playlistId: string): string {
  return `https://music.youtube.com/playlist?list=${playlistId}`;
}
