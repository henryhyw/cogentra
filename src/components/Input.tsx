import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-md2 border border-line bg-surface px-3 text-14 text-ink placeholder:text-whisper focus:border-ink focus:outline-none focus:ring-2 focus:ring-forest/20",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export default Input;
