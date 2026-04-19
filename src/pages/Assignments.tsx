import { MoreHorizontal, Plus, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import ConfidenceBar from "../components/ConfidenceBar";
import EmptyState from "../components/EmptyState";
import IconButton from "../components/IconButton";
import Input from "../components/Input";
import PageHeader from "../components/PageHeader";
import Select from "../components/Select";
import StatusPill from "../components/StatusPill";
import { assignments } from "../data/mock";
import { cn } from "../lib/cn";
import { FolderPlus } from "lucide-react";

type FilterValue = "All" | "Draft" | "Active" | "Archived";

const filters: FilterValue[] = ["All", "Draft", "Active", "Archived"];

export default function Assignments() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Last activity");
  const deferredSearch = useDeferredValue(search);

  const filteredAssignments = assignments
    .filter((assignment) => {
      if (activeFilter === "Draft") {
        return assignment.status === "draft";
      }
      if (activeFilter === "Active") {
        return assignment.status === "active";
      }
      if (activeFilter === "Archived") {
        return assignment.status === "archived";
      }
      return true;
    })
    .filter((assignment) => {
      const query = deferredSearch.toLowerCase().trim();
      if (!query) {
        return true;
      }

      return [assignment.name, assignment.course, assignment.description].some((value) =>
        value.toLowerCase().includes(query),
      );
    })
    .sort((left, right) => {
      if (sort === "Name") {
        return left.name.localeCompare(right.name);
      }
      if (sort === "Cases") {
        return right.caseCount - left.caseCount;
      }
      return 0;
    });

  return (
    <div className="mx-auto max-w-[1240px] px-8 py-8">
      <PageHeader
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate("/assignments/new")} size="md">
            New assignment
          </Button>
        }
        eyebrow="Workspace"
        subtitle="Create, configure, and review oral verifications."
        title="Assignments"
      />

      <div className="mt-8 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex h-9 items-center rounded-md2 bg-hover p-1">
          {filters.map((filter) => (
            <button
              className={cn(
                "rounded-sm2 px-3 text-13 transition-all duration-150 ease-out",
                activeFilter === filter ? "h-7 bg-surface text-ink shadow-e1" : "h-7 text-mute",
              )}
              key={filter}
              onClick={() => setActiveFilter(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
          <Input
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search assignments, courses, student IDs…"
            value={search}
          />
        </div>
        <div className="w-full xl:w-[220px]">
          <Select
            onChange={(event) => setSort(event.target.value)}
            options={[
              { label: "Last activity", value: "Last activity" },
              { label: "Name", value: "Name" },
              { label: "Cases", value: "Cases" },
              { label: "Created", value: "Created" },
            ]}
            value={sort}
          />
        </div>
      </div>

      <div className="mt-6">
        {filteredAssignments.length ? (
          <Card className="overflow-hidden" unstyled>
            {filteredAssignments.map((assignment, index) => {
              const progress = assignment.caseCount ? (assignment.readyCaseCount / assignment.caseCount) * 100 : 0;

              return (
                <button
                  className={cn(
                    "grid w-full grid-cols-[minmax(0,1fr)_140px_220px_140px_40px] items-center gap-4 px-5 py-4 text-left transition-colors duration-150 ease-out hover:bg-hover",
                    index < filteredAssignments.length - 1 && "border-b border-line",
                  )}
                  key={assignment.id}
                  onClick={() => navigate(`/assignments/${assignment.id}`)}
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="truncate text-15 font-medium text-ink">{assignment.name}</p>
                    <p className="truncate text-13 text-mute">
                      {assignment.course} · {assignment.submissionCount} submissions
                    </p>
                  </div>
                  <div>
                    <StatusPill state={assignment.status} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-12 text-mute">
                      {assignment.readyCaseCount} of {assignment.caseCount} cases ready
                    </p>
                    <ConfidenceBar level="high" value={progress} />
                  </div>
                  <p className="text-13 text-mute">{assignment.lastActivityAt}</p>
                  <div>
                    <IconButton aria-label="More options">
                      <MoreHorizontal className="h-4 w-4" />
                    </IconButton>
                  </div>
                </button>
              );
            })}
          </Card>
        ) : (
          <EmptyState
            action={
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate("/assignments/new")}>
                Create your first assignment
              </Button>
            }
            body="Start with an assignment brief and rubric, then Congentra will prepare the verification workspace."
            icon={FolderPlus}
            title="No assignments yet"
          />
        )}
      </div>
    </div>
  );
}
