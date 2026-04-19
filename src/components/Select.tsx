import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options?: SelectOption[];
  children?: ReactNode;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className, options, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "h-9 w-full appearance-none rounded-md2 border border-line bg-surface px-3 pr-9 text-14 text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-forest/20",
            className,
          )}
          {...props}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
