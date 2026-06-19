"use client";

import { useEffect, useRef } from "react";
import { usePlayer } from "@/context/PlayerContext";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubeIframe() {
  const { playerRef, currentVideo, onPlayerReady, onPlayerStateChange } =
    usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    function initPlayer() {
      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        width: "100%",
        height: "100%",
        videoId: "",
        playerVars: {
          autoplay: 1,
          playsinline: 1,    // critical for iOS inline playback
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: (e: YT.OnStateChangeEvent) =>
            onPlayerStateChange(e.data),
        },
      });
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [onPlayerReady, onPlayerStateChange, playerRef]);

  return (
    <div
      className="w-full"
      style={{ aspectRatio: "16/9" }}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
