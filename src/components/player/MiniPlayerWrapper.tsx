"use client";

import dynamic from "next/dynamic";
import { usePlayer } from "@/context/PlayerContext";

const MiniPlayer = dynamic(() => import("@/components/player/MiniPlayer"), { ssr: false });

export default function MiniPlayerWrapper() {
  const { selectionCount } = usePlayer();
  return <MiniPlayer hasSelection={selectionCount > 0} />;
}
