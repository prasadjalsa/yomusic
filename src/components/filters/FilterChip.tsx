import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export default function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-3 py-1">
      {label}
      <button
        onClick={onRemove}
        className="ml-1 hover:text-primary/60 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
