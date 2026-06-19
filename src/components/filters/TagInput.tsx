"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import type { FilterMode } from "@/types/filters";
import { cn } from "@/lib/utils";

interface TagInputProps {
  label: string;
  placeholder: string;
  tags: string[];
  mode: FilterMode;
  onTagsChange: (tags: string[]) => void;
  onModeChange: (mode: FilterMode) => void;
}

export default function TagInput({
  label,
  placeholder,
  tags,
  mode,
  onTagsChange,
  onModeChange,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(value: string) {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
    }
    setInput("");
  }

  function removeTag(index: number) {
    onTagsChange(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  const active = tags.length >= 2;

  return (
    <div className="space-y-1.5">
      {/* Label row — always full width on mobile */}
      <div className="flex items-center justify-between gap-2 min-h-[28px]">
        <label className="text-sm font-medium leading-none">{label}</label>

        {/* AND/OR toggle — always rendered, dimmed when < 2 tags */}
        <div
          className={cn(
            "flex items-center rounded-md border border-input overflow-hidden text-xs font-medium shrink-0 transition-opacity",
            !active && "opacity-35 pointer-events-none"
          )}
        >
          <button
            type="button"
            onClick={() => onModeChange("AND")}
            className={cn(
              "px-3 py-1 transition-colors",
              mode === "AND"
                ? "bg-primary text-white"
                : "bg-white text-muted-foreground hover:bg-gray-100"
            )}
          >
            AND
          </button>
          <div className="w-px h-4 bg-border" />
          <button
            type="button"
            onClick={() => onModeChange("OR")}
            className={cn(
              "px-3 py-1 transition-colors",
              mode === "OR"
                ? "bg-primary text-white"
                : "bg-white text-muted-foreground hover:bg-gray-100"
            )}
          >
            OR
          </button>
        </div>
      </div>

      {/* Tag + input area */}
      <div
        className="flex flex-wrap gap-1.5 min-h-[40px] w-full rounded-md border border-input bg-white px-2 py-1.5 text-sm cursor-text focus-within:ring-1 focus-within:ring-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1 shrink-0"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="hover:text-primary/60 ml-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? placeholder : "Add more…"}
          className="flex-1 min-w-[100px] bg-transparent outline-none placeholder:text-muted-foreground text-sm py-0.5"
        />
      </div>
      <p className="text-xs text-muted-foreground">Press Enter or , to add · AND/OR activates with 2+ names</p>
    </div>
  );
}
