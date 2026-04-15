import * as React from "react";

import { cn } from "../lib/cn";

export function Panel({
  className,
  children
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[var(--line)] bg-[var(--panel)]/88 p-6 shadow-[0_24px_80px_rgba(7,9,12,0.08)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
