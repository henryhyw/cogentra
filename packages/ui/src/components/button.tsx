import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[var(--accent)] px-4 py-2 text-[var(--accent-foreground)] shadow-[0_18px_60px_rgba(164,111,63,0.22)] hover:translate-y-[-1px] hover:shadow-[0_22px_70px_rgba(164,111,63,0.28)]",
        ghost:
          "border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-[var(--ink)] hover:border-[var(--ink)]/25 hover:bg-[var(--panel-strong)]",
        subtle:
          "border-transparent bg-transparent px-3 py-2 text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--ink)]"
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-4",
        lg: "h-12 px-5 text-base"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  )
);
Button.displayName = "Button";
