import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md2 font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:cursor-not-allowed",
    {
      "bg-ink text-white hover:bg-ink2 active:bg-black disabled:bg-whisper disabled:text-white": variant === "primary",
      "border border-line bg-surface text-ink hover:bg-hover": variant === "secondary",
      "bg-transparent text-ink hover:bg-hover": variant === "ghost",
      "border border-dangerSoft bg-surface text-danger hover:bg-dangerSoft": variant === "danger",
      "h-8 px-3 text-13": size === "sm",
      "h-9 px-3.5 text-14": size === "md",
      "h-11 px-4 text-15": size === "lg",
    },
    className,
  );
}

export default function Button({
  children,
  className,
  leftIcon,
  rightIcon,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button className={buttonStyles({ variant, size, className })} type={type} {...props}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
