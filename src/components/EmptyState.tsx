import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  action?: ReactNode;
  body: string;
  icon: LucideIcon;
  title: string;
};

export default function EmptyState({ action, body, icon: Icon, title }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Icon className="h-10 w-10 text-mute" />
      <div className="space-y-1">
        <h3 className="text-16 font-medium text-ink">{title}</h3>
        <p className="max-w-[440px] text-14 text-mute">{body}</p>
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
