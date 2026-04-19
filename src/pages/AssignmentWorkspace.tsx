import { Link, Outlet, useParams } from "react-router-dom";
import Button, { buttonStyles } from "../components/Button";
import StatusPill from "../components/StatusPill";
import SubTabs from "../components/SubTabs";
import { getAssignmentById } from "../data/mock";

export default function AssignmentWorkspace() {
  const { id = "" } = useParams();
  const assignment = getAssignmentById(id);

  if (!assignment) {
    return (
      <div className="px-8 py-16">
        <p className="text-15 text-mute">Assignment not found.</p>
      </div>
    );
  }

  const basePath = `/assignments/${assignment.id}`;

  return (
    <div>
      <div className="sticky top-14 z-10 border-b border-line bg-paper">
        <div className="mx-auto max-w-[1240px] px-8">
          <div className="flex flex-col gap-6 py-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-12 uppercase tracking-widest text-mute">Assignment</p>
              <h1 className="display text-36 text-ink">{assignment.name}</h1>
              <p className="text-13 text-mute">
                {assignment.course} · {assignment.submissionCount} submissions · Created {assignment.createdAt}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill state={assignment.status} />
              <Button size="md" variant="secondary">
                Share link
              </Button>
              <Link className={buttonStyles({ size: "md", variant: "primary" })} to={`${basePath}/cases`}>
                Open cases
              </Link>
            </div>
          </div>
          <SubTabs
            items={[
              { label: "Overview", to: basePath, end: true },
              { label: "Materials", to: `${basePath}/materials` },
              { label: "Understanding", to: `${basePath}/understanding` },
              { label: "Verification Goals", to: `${basePath}/goals` },
              { label: "Session Settings", to: `${basePath}/session-settings` },
              { label: "Submissions", to: `${basePath}/submissions` },
              { label: "Cases", to: `${basePath}/cases` },
            ]}
          />
        </div>
      </div>
      <div className="mx-auto max-w-[1240px] px-8 py-8">
        <Outlet />
      </div>
    </div>
  );
}
