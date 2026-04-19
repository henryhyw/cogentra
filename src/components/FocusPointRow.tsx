import { ChevronRight } from "lucide-react";
import type { FocusPoint } from "../data/mock";
import { cn } from "../lib/cn";
import ConfidenceDot from "./ConfidenceDot";

type FocusPointRowProps = {
  active?: boolean;
  focusPoint: FocusPoint;
  onClick?: () => void;
};

export default function FocusPointRow({ active = false, focusPoint, onClick }: FocusPointRowProps) {
  return (
    <button
      className={cn(
        "relative flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-hover",
        active && "bg-hover",
      )}
      onClick={onClick}
      type="button"
    >
      {active ? <span className="absolute inset-y-0 left-0 w-0.5 bg-forest" /> : null}
      <ConfidenceDot className="mt-1" level={focusPoint.level} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-13 font-medium text-ink">{focusPoint.title}</p>
        <p className="truncate text-12 text-mute">{focusPoint.listMeta}</p>
      </div>
      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-mute" />
    </button>
  );
}
