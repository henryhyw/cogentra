import * as React from "react";

import { cn } from "../lib/cn";

export function Badge({
  children,
  className
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted)]",
        className
      )}
    >
      {children}
    </span>
  );
}
