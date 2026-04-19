import { cn } from "../lib/cn";

type AvatarProps = {
  name: string;
  size?: 24 | 28 | 32 | 40 | 56;
  className?: string;
};

const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
  24: "h-6 w-6 text-11",
  28: "h-7 w-7 text-12",
  32: "h-8 w-8 text-12",
  40: "h-10 w-10 text-13",
  56: "h-14 w-14 text-18",
};

export default function Avatar({ className, name, size = 32 }: AvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-forestSoft font-medium text-forest",
        sizeClasses[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
