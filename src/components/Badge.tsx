import { cn } from "../lib/cn";

export type BadgeVariant = "neutral" | "draft" | "active" | "warn" | "danger" | "ready";

type BadgeProps = {
  children: string;
  className?: string;
  dot?: boolean;
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-line bg-hover text-ink2",
  draft: "border-line bg-hover text-mute",
  active: "border-forestSoft bg-forestSoft text-forest",
  warn: "border-warnSoft bg-warnSoft text-warn",
  danger: "border-dangerSoft bg-dangerSoft text-danger",
  ready: "border-line2 bg-surface text-ink",
};

export default function Badge({
  children,
  className,
  dot = false,
  variant = "neutral",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-sm2 border px-2.5 text-12 font-medium tracking-tight",
        variantClasses[variant],
        className,
      )}
    >
      {dot ? (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-ink2": variant === "neutral",
            "bg-mute": variant === "draft",
            "bg-forest": variant === "active",
            "bg-warn": variant === "warn",
            "bg-danger": variant === "danger",
            "bg-ink": variant === "ready",
          })}
        />
      ) : null}
      {children}
    </span>
  );
}
