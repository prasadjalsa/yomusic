"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { HelpCircle, X, Music2, ListMusic, Search, PlusCircle, SlidersHorizontal, RefreshCw } from "lucide-react";

const steps = [
  {
    icon: <Search className="h-5 w-5 text-primary shrink-0 mt-0.5" />,
    title: "Set your filters",
    desc: "Choose a language, then add music directors, singers, lyricists, or starring actors using the tag inputs. Press Enter after each name. Toggle AND/OR to combine or separate them.",
  },
  {
    icon: <SlidersHorizontal className="h-5 w-5 text-primary shrink-0 mt-0.5" />,
    title: "AND vs OR",
    desc: "AND means all names appear together in one search (great for collaborations). OR runs a separate search per name and merges the results — up to 5 combinations.",
  },
  {
    icon: <Music2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />,
    title: "Pick your songs",
    desc: "Click Search Songs. Results show matching YouTube videos. Tick the ones you want — untick any you don't. Songs already in a saved playlist are hidden automatically.",
  },
  {
    icon: <PlusCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />,
    title: "Create or add to a playlist",
    desc: "Type a name at the bottom bar and click Create Playlist to make a new YouTube playlist. Or toggle 'Add to existing playlist' above the search form to append to one you already have.",
  },
  {
    icon: <ListMusic className="h-5 w-5 text-primary shrink-0 mt-0.5" />,
    title: "View your playlists",
    desc: "All playlists you've created are saved under My Playlists. Open them on YouTube, add more songs, or remove them from history.",
  },
  {
    icon: <RefreshCw className="h-5 w-5 text-primary shrink-0 mt-0.5" />,
    title: "YouTube access",
    desc: "The app uses your Google account to create playlists on your YouTube channel. If your session expires, it refreshes automatically when you open the dashboard.",
  },
];

export default function HelpDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Help</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              How Yomusicly works
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-5">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                {step.icon}
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-primary/5 border border-primary/20 p-4 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Quota note:</strong> Each search uses 100 YouTube API units. Creating a playlist uses 50 + 50 per song. The free daily limit is 10,000 units — enough for ~6 sessions of 2 searches + a 10-song playlist.
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
