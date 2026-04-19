import { Copy, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Avatar from "../../components/Avatar";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ConfidenceDot from "../../components/ConfidenceDot";
import IconButton from "../../components/IconButton";
import Input from "../../components/Input";
import Select from "../../components/Select";
import StatusPill from "../../components/StatusPill";
import { getCasesByAssignmentId } from "../../data/mock";
import { cn } from "../../lib/cn";

const filters = ["All", "Awaiting", "In progress", "Ready", "Rejected"] as const;

export default function Cases() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Last activity");
  const deferredSearch = useDeferredValue(search);

  const rows = getCasesByAssignmentId(id)
    .filter((caseRecord) => {
      if (filter === "Awaiting") {
        return caseRecord.status === "awaiting_submission";
      }
      if (filter === "In progress") {
        return ["session_pending", "session_in_progress", "processing"].includes(caseRecord.status);
      }
      if (filter === "Ready") {
        return caseRecord.status === "ready";
      }
      if (filter === "Rejected") {
        return caseRecord.status === "rejected";
      }
      return true;
    })
    .filter((caseRecord) => {
      const query = deferredSearch.toLowerCase().trim();
      if (!query) {
        return true;
      }
      return [caseRecord.studentName, caseRecord.studentId].some((value) => value.toLowerCase().includes(query));
    })
    .sort((left, right) => {
      if (sort === "Name") {
        return left.studentName.localeCompare(right.studentName);
      }
      if (sort === "Confidence") {
        const order = { high: 3, medium: 2, low: 1 };
        return (order[right.confidence ?? "low"] ?? 0) - (order[left.confidence ?? "low"] ?? 0);
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex h-9 items-center rounded-md2 bg-hover p-1">
          {filters.map((item) => (
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
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
          <Input
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by student name or ID"
            value={search}
          />
        </div>
        <div className="w-full xl:w-[220px]">
          <Select
            onChange={(event) => setSort(event.target.value)}
            options={[
              { label: "Last activity", value: "Last activity" },
              { label: "Name", value: "Name" },
              { label: "Confidence", value: "Confidence" },
            ]}
            value={sort}
          />
        </div>
      </div>

      <Card className="overflow-hidden" unstyled>
        {rows.map((caseRecord) => (
          <button
            className="grid w-full grid-cols-[minmax(0,1fr)_160px_120px_80px_120px_140px] items-center gap-4 border-b border-line px-5 py-4 text-left last:border-b-0 transition-colors duration-150 ease-out hover:bg-hover"
            key={caseRecord.id}
            onClick={() => navigate(`/assignments/${id}/cases/${caseRecord.id}`)}
            type="button"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={caseRecord.studentName} size={32} />
              <div className="min-w-0">
                <p className="truncate text-14 font-medium text-ink">{caseRecord.studentName}</p>
                <p className="mono text-12 text-mute">{caseRecord.studentId}</p>
              </div>
            </div>
            <StatusPill state={caseRecord.status} />
            <div className="text-13 text-ink">
              {caseRecord.confidence ? (
                <span className="flex items-center gap-2">
                  <ConfidenceDot level={caseRecord.confidence} />
                  <span className="capitalize">{caseRecord.confidence}</span>
                </span>
              ) : (
                <span className="text-mute">—</span>
              )}
            </div>
            <p className="text-13 text-mute">{caseRecord.submittedFilesCount}</p>
            <p className="text-13 text-mute">{caseRecord.lastActivityAt}</p>
            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/assignments/${id}/cases/${caseRecord.id}`);
                }}
                size="sm"
                variant="ghost"
              >
                Open
              </Button>
              <IconButton
                aria-label="Copy case link"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <Copy className="h-4 w-4" />
              </IconButton>
            </div>
          </button>
        ))}
      </Card>
    </div>
  );
}
