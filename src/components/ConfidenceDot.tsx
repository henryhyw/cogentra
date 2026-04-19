import { cn } from "../lib/cn";

export type ConfidenceLevel = "high" | "medium" | "low";

type ConfidenceDotProps = {
  level: ConfidenceLevel;
  className?: string;
};

export default function ConfidenceDot({ className, level }: ConfidenceDotProps) {
  return (
    <span
      className={cn("inline-flex h-1.5 w-1.5 rounded-full", className, {
        "bg-success": level === "high",
        "bg-warn": level === "medium",
        "bg-danger": level === "low",
      })}
    />
  );
}
