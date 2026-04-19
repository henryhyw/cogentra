import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
};

export default function PageHeader({ actions, eyebrow, subtitle, title }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <p className="text-12 uppercase tracking-widest text-mute">{eyebrow}</p>
        <h1 className="display text-36 text-ink">{title}</h1>
        <p className="max-w-[640px] text-15 text-mute">{subtitle}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
