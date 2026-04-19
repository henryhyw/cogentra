import Badge, { type BadgeVariant } from "./Badge";

export type StatusPillState =
  | "awaiting_submission"
  | "session_pending"
  | "session_in_progress"
  | "processing"
  | "ready"
  | "rejected"
  | "draft"
  | "active"
  | "complete"
  | "archived";

const statusMap: Record<StatusPillState, { label: string; variant: BadgeVariant }> = {
  awaiting_submission: { label: "Awaiting submission", variant: "draft" },
  session_pending: { label: "Session not started", variant: "neutral" },
  session_in_progress: { label: "Session in progress", variant: "warn" },
  processing: { label: "Processing", variant: "neutral" },
  ready: { label: "Result ready", variant: "active" },
  rejected: { label: "Rejected", variant: "danger" },
  draft: { label: "Draft", variant: "draft" },
  active: { label: "Active", variant: "active" },
  complete: { label: "Complete", variant: "ready" },
  archived: { label: "Archived", variant: "neutral" },
};

type StatusPillProps = {
  state: StatusPillState;
};

export default function StatusPill({ state }: StatusPillProps) {
  const config = statusMap[state];
  return (
    <Badge dot variant={config.variant}>
      {config.label}
    </Badge>
  );
}
