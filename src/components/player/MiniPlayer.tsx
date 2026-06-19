"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  ChevronDown, ChevronUp, SkipBack, SkipForward,
  Play, Pause, ListMusic, X,
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const YouTubeIframe = dynamic(() => import("./YouTubeIframe"), { ssr: false });

const SELECTION_BAR_HEIGHT = 72;

interface MiniPlayerProps {
  hasSelection: boolean;
}

export default function MiniPlayer({ hasSelection }: MiniPlayerProps) {
  const {
    currentVideo, queue, currentIndex, isPlaying, isExpanded,
    playAt, playNext, playPrev, togglePlay, toggleExpanded, clearQueue,
  } = usePlayer();

  const queueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && queueRef.current) {
      const active = queueRef.current.querySelector("[data-active='true']");
      active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isExpanded, currentIndex]);

  if (!currentVideo) return null;

  const bottomOffset = hasSelection ? SELECTION_BAR_HEIGHT : 0;

  return (
    <>
      {isExpanded && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={toggleExpanded} />
      )}

      <div
        className={cn(
          "fixed left-0 right-0 z-40 bg-white shadow-2xl transition-[height] duration-300 ease-in-out rounded-t-2xl overflow-hidden",
          isExpanded ? "h-[72vh]" : "h-16"
        )}
        style={{ bottom: `${bottomOffset}px` }}
      >
        {/*
          YouTubeIframe is ALWAYS in the DOM — never inside a conditional.
          display:none keeps the DOM node alive so YT.Player persists and audio continues.
          It is shown only in the expanded state.
        */}
        <div style={{ display: isExpanded ? "block" : "none" }}>
          <YouTubeIframe />
        </div>

        {/* Expanded content — rendered on top of iframe */}
        {isExpanded && (
          <div className="flex flex-col" style={{ height: "calc(72vh - 56.25vw)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <button onClick={toggleExpanded} className="text-muted-foreground hover:text-foreground">
                <ChevronDown className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold truncate max-w-[60%] text-center">
                {currentVideo.title}
              </span>
              <button onClick={clearQueue} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Song info + controls */}
            <div className="px-4 py-3 shrink-0">
              <p className="text-sm font-medium line-clamp-1">{currentVideo.title}</p>
              <p className="text-xs text-muted-foreground">{currentVideo.channelTitle}</p>
              <div className="flex items-center justify-center gap-8 mt-3">
                <button onClick={playPrev} disabled={currentIndex === 0}
                  className="disabled:opacity-30 hover:text-primary transition-colors">
                  <SkipBack className="h-6 w-6" />
                </button>
                <button onClick={togglePlay}
                  className="bg-primary text-white rounded-full p-3 hover:bg-primary/90 transition-colors">
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </button>
                <button onClick={playNext} disabled={currentIndex === queue.length - 1}
                  className="disabled:opacity-30 hover:text-primary transition-colors">
                  <SkipForward className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Queue */}
            <div className="flex-1 overflow-y-auto border-t" ref={queueRef}>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 sticky top-0">
                <ListMusic className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Queue — {queue.length} song{queue.length !== 1 ? "s" : ""}
                </span>
              </div>
              {queue.map((v, i) => (
                <button key={v.videoId} data-active={i === currentIndex}
                  onClick={() => playAt(i)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/50",
                    i === currentIndex && "bg-primary/5 border-l-2 border-primary"
                  )}>
                  {v.thumbnailUrl && (
                    <div className="relative h-10 w-[72px] shrink-0 rounded overflow-hidden">
                      <Image src={v.thumbnailUrl} alt={v.title} fill sizes="72px" className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs line-clamp-1",
                      i === currentIndex ? "font-semibold text-primary" : "font-medium")}>
                      {v.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{v.channelTitle}</p>
                  </div>
                  {i === currentIndex && isPlaying && (
                    <div className="flex gap-0.5 items-end shrink-0">
                      {[1, 2, 3].map((b) => (
                        <div key={b} className="w-0.5 bg-primary rounded-full animate-bounce"
                          style={{ height: `${8 + b * 3}px`, animationDelay: `${b * 0.1}s` }} />
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Collapsed mini bar — shown when not expanded */}
        {!isExpanded && (
          <div className="flex items-center gap-3 h-16 px-3 cursor-pointer select-none absolute inset-0"
            onClick={toggleExpanded}>
            {currentVideo.thumbnailUrl && (
              <div className="relative h-10 w-[56px] shrink-0 rounded overflow-hidden">
                <Image src={currentVideo.thumbnailUrl} alt={currentVideo.title} fill sizes="56px" className="object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold line-clamp-1">{currentVideo.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentVideo.channelTitle}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button onClick={playPrev} disabled={currentIndex === 0}
                className="p-2 disabled:opacity-30 hover:text-primary transition-colors">
                <SkipBack className="h-4 w-4" />
              </button>
              <button onClick={togglePlay} className="p-2 hover:text-primary transition-colors">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button onClick={playNext} disabled={currentIndex === queue.length - 1}
                className="p-2 disabled:opacity-30 hover:text-primary transition-colors">
                <SkipForward className="h-4 w-4" />
              </button>
              <button onClick={toggleExpanded} className="p-2 text-muted-foreground hover:text-foreground">
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
