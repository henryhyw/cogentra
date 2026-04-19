import { BellOff, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import IconButton from "../components/IconButton";
import PageHeader from "../components/PageHeader";
import { notifications } from "../data/mock";
import { cn } from "../lib/cn";

export default function Notifications() {
  const [filter, setFilter] = useState<"All" | "Unread">("All");

  const rows = notifications.filter((notification) => (filter === "Unread" ? !notification.read : true));

  const renderLine = (notification: (typeof notifications)[number]) => {
    if (notification.type === "session_completed") {
      return (
        <>
          <strong>{notification.studentName}</strong> completed their oral session for <strong>{notification.assignmentName}</strong>.
        </>
      );
    }

    if (notification.type === "submission_processed") {
      return <>{notification.detail}</>;
    }

    return (
      <>
        Assignment <strong>{notification.assignmentName}</strong> finished processing.
      </>
    );
  };

  return (
    <div className="mx-auto max-w-[1240px] px-8 py-8">
      <PageHeader
        actions={<button className="text-14 text-ink transition-colors duration-150 ease-out hover:text-mute">Mark all read</button>}
        eyebrow="Workspace"
        subtitle="Case updates, processing events, and reviewer-facing alerts."
        title="Notifications"
      />

      <div className="mt-6 flex h-9 w-fit items-center rounded-md2 bg-hover p-1">
        {(["All", "Unread"] as const).map((item) => (
          <button
            className={cn(
              "h-7 rounded-sm2 px-3 text-13 transition-all duration-150 ease-out",
              filter === item ? "bg-surface text-ink shadow-e1" : "text-mute",
            )}
            key={item}
            onClick={() => setFilter(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {rows.length ? (
          <Card className="overflow-hidden" unstyled>
            {rows.map((notification) => (
              <div className="grid grid-cols-[24px_minmax(0,1fr)_40px] gap-4 border-b border-line px-5 py-4 last:border-b-0" key={notification.id}>
                <div className="pt-1">
                  <span
                    className={cn(
                      "inline-flex h-3 w-3 rounded-full border border-line",
                      notification.read ? "bg-surface" : "border-forest bg-forest",
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-14 text-ink">{renderLine(notification)}</p>
                  <p className="text-12 text-mute">
                    {notification.timeAgo}
                    {notification.caseId ? (
                      <>
                        {" "}
                        ·{" "}
                        <Link className="text-linkBlue transition-colors duration-150 ease-out hover:text-ink" to={`/assignments/${notification.assignmentId}/cases/${notification.caseId}`}>
                          Open case →
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                <IconButton aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </IconButton>
              </div>
            ))}
          </Card>
        ) : (
          <EmptyState body="You have no unread reviewer events right now." icon={BellOff} title="You're all caught up." />
        )}
      </div>
    </div>
  );
}
