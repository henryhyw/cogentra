import { cn } from "../lib/cn";

type DividerProps = {
  className?: string;
  orientation?: "horizontal" | "vertical";
};

export default function Divider({ className, orientation = "horizontal" }: DividerProps) {
  return (
    <hr
      className={cn(
        "border-0 bg-line",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  );
}
