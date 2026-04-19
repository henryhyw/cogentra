import { CircleHelp, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { getAssignmentById, getCaseById } from "../data/mock";
import Button, { buttonStyles } from "./Button";
import IconButton from "./IconButton";

type Crumb = {
  label: string;
  to?: string;
};

function getBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length) {
    return [{ label: "Assignments", to: "/assignments" }];
  }

  if (segments[0] === "assignments" && segments.length === 1) {
    return [{ label: "Assignments" }];
  }

  if (segments[0] === "assignments" && segments[1] === "new") {
    return [
      { label: "Assignments", to: "/assignments" },
      { label: "New assignment" },
    ];
  }

  if (segments[0] === "assignments" && segments[1]) {
    const assignment = getAssignmentById(segments[1]);
    const crumbs: Crumb[] = [
      { label: "Assignments", to: "/assignments" },
      { label: assignment?.name ?? "Assignment", to: `/assignments/${segments[1]}` },
    ];

    if (segments[2] === "cases" && segments[3]) {
      const caseRecord = getCaseById(segments[3]);
      crumbs.push({ label: "Cases", to: `/assignments/${segments[1]}/cases` });
      crumbs.push({ label: caseRecord?.studentName ?? "Case result" });
      return crumbs;
    }

    if (segments[2]) {
      const labels: Record<string, string> = {
        materials: "Materials",
        understanding: "Assignment Understanding",
        goals: "Verification Goals",
        "session-settings": "Session Settings",
        submissions: "Submissions",
        cases: "Cases",
      };
      crumbs.push({ label: labels[segments[2]] ?? segments[2] });
    }

    return crumbs;
  }

  if (segments[0] === "notifications") {
    return [{ label: "Notifications" }];
  }

  if (segments[0] === "settings") {
    return [{ label: "Settings" }];
  }

  return [{ label: "Congentra" }];
}

function renderContextAction(pathname: string) {
  if (pathname === "/notifications") {
    return (
      <Button size="sm" variant="ghost">
        Mark all read
      </Button>
    );
  }

  if (pathname.startsWith("/assignments/") && pathname.includes("/cases/")) {
    return (
      <Button size="sm" variant="ghost">
        Export summary
      </Button>
    );
  }

  if (pathname.startsWith("/assignments/") && pathname !== "/assignments/new") {
    const segments = pathname.split("/").filter(Boolean);
    const assignmentRoot = `/${segments.slice(0, 2).join("/")}`;
    return (
      <Link className={buttonStyles({ size: "sm", variant: "ghost" })} to={`${assignmentRoot}/cases`}>
        Open cases
      </Link>
    );
  }

  return null;
}

export default function Topbar() {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper px-8">
      <nav className="flex items-center text-13">
        {breadcrumbs.map((crumb, index) => (
          <div className="flex items-center" key={`${crumb.label}-${index}`}>
            {index > 0 ? <span className="px-2 text-whisper">/</span> : null}
            {crumb.to ? (
              <Link className="text-mute transition-colors duration-150 ease-out hover:text-ink" to={crumb.to}>
                {crumb.label}
              </Link>
            ) : (
              <span className={index === breadcrumbs.length - 1 ? "text-ink" : "text-mute"}>{crumb.label}</span>
            )}
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        {renderContextAction(location.pathname)}
        <IconButton aria-label="Search">
          <Search className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label="Help">
          <CircleHelp className="h-4 w-4" />
        </IconButton>
      </div>
    </header>
  );
}
