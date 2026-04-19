import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-24 w-full rounded-md2 border border-line bg-surface px-3 py-2.5 text-14 text-ink placeholder:text-whisper focus:border-ink focus:outline-none focus:ring-2 focus:ring-forest/20",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
