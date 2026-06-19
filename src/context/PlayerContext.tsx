"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { VideoResult } from "@/types/youtube";

interface PlayerState {
  queue: VideoResult[];
  currentIndex: number;
  isPlaying: boolean;
  isExpanded: boolean;
}

interface PlayerContextValue extends PlayerState {
  currentVideo: VideoResult | null;
  selectionCount: number;
  setSelectionCount: (n: number) => void;
  playVideo: (video: VideoResult, queue?: VideoResult[]) => void;
  playAt: (index: number) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  toggleExpanded: () => void;
  addToQueue: (video: VideoResult) => void;
  clearQueue: () => void;
  // IFrame API ref — set by YouTubeIframe component
  playerRef: React.MutableRefObject<YT.Player | null>;
  onPlayerReady: () => void;
  onPlayerStateChange: (state: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<VideoResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectionCount, setSelectionCount] = useState(0);
  const playerRef = useRef<YT.Player | null>(null);
  const pendingVideoId = useRef<string | null>(null);

  const currentVideo = queue[currentIndex] ?? null;

  const loadVideo = useCallback((videoId: string) => {
    if (playerRef.current && typeof playerRef.current.loadVideoById === "function") {
      playerRef.current.loadVideoById(videoId);
      setIsPlaying(true);
    } else {
      // Player not ready yet — store for when it becomes ready
      pendingVideoId.current = videoId;
    }
  }, []);

  const playVideo = useCallback(
    (video: VideoResult, newQueue?: VideoResult[]) => {
      const q = newQueue ?? [video];
      const idx = q.findIndex((v) => v.videoId === video.videoId);
      const finalIdx = idx === -1 ? 0 : idx;

      setQueue(q);
      setCurrentIndex(finalIdx);
      loadVideo(q[finalIdx].videoId);
    },
    [loadVideo]
  );

  const playAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= queue.length) return;
      setCurrentIndex(index);
      loadVideo(queue[index].videoId);
    },
    [queue, loadVideo]
  );

  const playNext = useCallback(() => {
    const next = currentIndex + 1;
    if (next < queue.length) playAt(next);
  }, [currentIndex, queue.length, playAt]);

  const playPrev = useCallback(() => {
    const prev = currentIndex - 1;
    if (prev >= 0) playAt(prev);
  }, [currentIndex, playAt]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const addToQueue = useCallback((video: VideoResult) => {
    setQueue((prev) => {
      if (prev.some((v) => v.videoId === video.videoId)) return prev;
      return [...prev, video];
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setIsExpanded(false);
    playerRef.current?.stopVideo();
  }, []);

  const onPlayerReady = useCallback(() => {
    if (pendingVideoId.current) {
      playerRef.current?.loadVideoById(pendingVideoId.current);
      pendingVideoId.current = null;
      setIsPlaying(true);
    }
  }, []);

  const onPlayerStateChange = useCallback(
    (state: number) => {
      // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
      if (state === 1) setIsPlaying(true);
      else if (state === 2) setIsPlaying(false);
      else if (state === 0) {
        // Auto-advance
        const next = currentIndex + 1;
        if (next < queue.length) {
          setCurrentIndex(next);
          playerRef.current?.loadVideoById(queue[next].videoId);
        } else {
          setIsPlaying(false);
        }
      }
    },
    [currentIndex, queue]
  );

  return (
    <PlayerContext.Provider
      value={{
        queue,
        currentIndex,
        isPlaying,
        isExpanded,
        currentVideo,
        selectionCount,
        setSelectionCount,
        playVideo,
        playAt,
        playNext,
        playPrev,
        togglePlay,
        toggleExpanded,
        addToQueue,
        clearQueue,
        playerRef,
        onPlayerReady,
        onPlayerStateChange,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
