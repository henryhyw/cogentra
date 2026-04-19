import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function iconButtonStyles(className?: string) {
  return cn(
    "inline-flex h-8 w-8 items-center justify-center rounded-md2 border border-line bg-surface text-ink transition-colors duration-150 ease-out hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-whisper",
    className,
  );
}

export default function IconButton({
  children,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button className={iconButtonStyles(className)} type={type} {...props}>
      {children}
    </button>
  );
}
