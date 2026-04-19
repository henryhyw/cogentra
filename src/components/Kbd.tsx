import type { ReactNode } from "react";

type KbdProps = {
  children: ReactNode;
};

export default function Kbd({ children }: KbdProps) {
  return (
    <kbd className="mono inline-flex h-5 min-w-5 items-center justify-center rounded-sm2 border border-line bg-hover px-1 text-11 text-mute">
      {children}
    </kbd>
  );
}
