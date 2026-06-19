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

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none">{label}</label>
        {tags.length >= 2 && (
          <div className="flex items-center gap-0.5 rounded-md border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => onModeChange("AND")}
              className={cn(
                "px-2 py-0.5 transition-colors",
                mode === "AND"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              AND
            </button>
            <button
              type="button"
              onClick={() => onModeChange("OR")}
              className={cn(
                "px-2 py-0.5 transition-colors",
                mode === "OR"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              OR
            </button>
          </div>
        )}
      </div>

      <div
        className="flex flex-wrap gap-1.5 min-h-9 w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5 shrink-0"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="hover:text-primary/60"
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
          className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
        />
      </div>
      <p className="text-xs text-muted-foreground">Press Enter or , to add</p>
    </div>
  );
}
