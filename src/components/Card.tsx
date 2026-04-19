import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type CardProps = {
  bodyClassName?: string;
  children?: ReactNode;
  className?: string;
  header?: ReactNode;
  headerClassName?: string;
  unstyled?: boolean;
};

export default function Card({
  bodyClassName,
  children,
  className,
  header,
  headerClassName,
  unstyled = false,
}: CardProps) {
  return (
    <section className={cn("rounded-xl2 border border-line bg-surface shadow-e1", className)}>
      {header ? <div className={cn("border-b border-line px-5 py-4", headerClassName)}>{header}</div> : null}
      {unstyled ? children : <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>}
    </section>
  );
}
