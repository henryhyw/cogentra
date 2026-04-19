import { NavLink } from "react-router-dom";
import { cn } from "../lib/cn";

export type TabItem = {
  end?: boolean;
  label: string;
  to: string;
};

type TabsProps = {
  items: TabItem[];
  className?: string;
};

export default function Tabs({ className, items }: TabsProps) {
  return (
    <div className={cn("flex gap-1 border-b border-line", className)}>
      {items.map((item) => (
        <NavLink end={item.end} key={item.to} to={item.to}>
          {({ isActive }) => (
            <span
              className={cn(
                "relative inline-flex h-10 items-center px-3 text-14 font-medium text-mute transition-colors duration-150 ease-out hover:text-ink",
                isActive && "text-ink",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "absolute bottom-[-1px] left-0 h-[2px] w-full bg-ink opacity-0 transition-opacity duration-150 ease-out",
                  isActive && "opacity-100",
                )}
              />
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
}
