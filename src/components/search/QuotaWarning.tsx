import { AlertTriangle } from "lucide-react";

interface QuotaWarningProps {
  estimatedCost: number;
  action: "search" | "create";
}

export default function QuotaWarning({ estimatedCost, action }: QuotaWarningProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      This {action === "search" ? "search" : "playlist creation"} will use ~{estimatedCost} of your
      daily 10,000 YouTube API quota units.
    </div>
  );
}
