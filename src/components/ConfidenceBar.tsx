import { cn } from "../lib/cn";
import type { ConfidenceLevel } from "./ConfidenceDot";

type ConfidenceBarProps = {
  value: number;
  level: ConfidenceLevel;
  className?: string;
};

export default function ConfidenceBar({ className, level, value }: ConfidenceBarProps) {
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-line", className)}>
      <div
        className={cn("h-full rounded-full", {
          "bg-success": level === "high",
          "bg-warn": level === "medium",
          "bg-danger": level === "low",
        })}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
