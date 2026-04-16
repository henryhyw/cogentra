"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock3, Filter, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Badge,
  Button,
  Card,
  CasesTable,
  EmptyState,
  ErrorAlert,
  InlineSearch,
  OverviewStatCard,
  PageHeader,
  StatusBadge,
} from "@concentra/ui";

import { CreateAssignmentDialog } from "@/components/create-assignment-dialog";
import { ReviewerShell } from "@/components/reviewer-shell";
import { api } from "@/lib/api";

export default function AssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") ?? "dashboard";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "draft" | "archived">("all");
  const [openCreate, setOpenCreate] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
  });

  const assignmentsQuery = useQuery({
    queryKey: ["assignments"],
    queryFn: api.assignments,
  });

  const assignments = assignmentsQuery.data ?? [];
  const filteredAssignments = useMemo(() => {
    const value = deferredSearch.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const matchesSearch =
        !value ||
        assignment.title.toLowerCase().includes(value) ||
        assignment.family.toLowerCase().includes(value) ||
        assignment.status.toLowerCase().includes(value);
      const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, deferredSearch, statusFilter]);

  const loading = dashboardQuery.isLoading || assignmentsQuery.isLoading;
  const error = dashboardQuery.error ?? assignmentsQuery.error;

  return (
    <ReviewerShell>
      <CreateAssignmentDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={() => {
          assignmentsQuery.refetch();
          dashboardQuery.refetch();
        }}
      />

      <PageHeader
        title={currentView === "dashboard" ? "Dashboard" : "Assignments"}
        subtitle={
          currentView === "dashboard"
            ? "Orient quickly around recent assignments, flagged cases, and sessions that are ready for grounded review."
            : "Open any assignment workspace, create a new one, or filter by reviewer readiness without leaving the assignment-centric flow."
        }
        action={
          <div className="flex gap-2">
            <Button variant={currentView === "dashboard" ? "secondary" : "ghost"} onClick={() => router.push("/assignments?view=dashboard")}>
              Dashboard
            </Button>
            <Button variant={currentView === "list" ? "secondary" : "ghost"} onClick={() => router.push("/assignments?view=list")}>
              Assignments
            </Button>
            <Button onClick={() => setOpenCreate(true)}>
              <Plus className="size-4" />
              New Assignment
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorAlert
          title="Unable to load reviewer workspace"
          description={error instanceof Error ? error.message : "Refresh the page to try again."}
          onRetry={() => {
            assignmentsQuery.refetch();
            dashboardQuery.refetch();
          }}
        />
      ) : null}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-32 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : currentView === "dashboard" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OverviewStatCard
              label="Active Assignments"
              value={dashboardQuery.data?.activeAssignments ?? 0}
              detail="Assignments with live workspace state and case generation ready."
            />
            <OverviewStatCard
              label="Pending Reviews"
              value={dashboardQuery.data?.pendingReviews ?? 0}
              detail="Completed oral sessions that still need a reviewer note."
              accent="warning"
            />
            <OverviewStatCard
              label="Sessions Completed"
              value={dashboardQuery.data?.sessionsCompleted ?? 0}
              detail="Student sessions with transcripts and structured evidence packages."
              accent="success"
            />
            <OverviewStatCard
              label="Cases With Flags"
              value={dashboardQuery.data?.casesWithFlags ?? 0}
              detail="Cases with neutral inconsistency flags or weaker focus-point verification."
              accent="warning"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
            <Card className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-foreground">Recent assignments</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The most recent workspaces with artifact readiness and case throughput at a glance.
                  </p>
                </div>
                <Badge tone="primary">
                  <Sparkles className="size-3" />
                  Assignment intelligence
                </Badge>
              </div>
              <div className="space-y-4">
                {dashboardQuery.data?.recentAssignments.map((assignment) => (
                  <Link key={assignment.id} href={`/assignments/${assignment.id}`} className="block rounded-3xl border border-border/60 bg-white/5 p-5 transition hover:bg-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{assignment.title}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge tone="neutral">{assignment.family.replaceAll("_", " ")}</Badge>
                          <StatusBadge status={assignment.status} />
                        </div>
                      </div>
                      <ArrowBadge text={`${assignment.caseCount} cases`} />
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
                      <span>{assignment.artifactCount} artifacts</span>
                      <span>{assignment.completedSessionCount} sessions completed</span>
                      <span>{assignment.pendingReviewCount} pending reviews</span>
                      <span>Updated {assignment.updatedAt.slice(0, 10)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-foreground">Pending reviews</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Medium and high-priority cases that need reviewer judgment.
                    </p>
                  </div>
                </div>
                <CasesTable
                  headers={["Student", "Assignment", "Priority", "Reason", "Open"]}
                  rows={(dashboardQuery.data?.pendingCases ?? []).map((caseItem) => [
                    <div key={`${caseItem.id}-student`} className="space-y-1">
                      <p className="font-medium text-foreground">{caseItem.studentName ?? caseItem.studentIdentifier}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{caseItem.studentIdentifier}</p>
                    </div>,
                    <p key={`${caseItem.id}-assignment`} className="max-w-xs text-sm text-muted-foreground">
                      {assignments.find((assignment) => assignment.id === caseItem.assignmentId)?.title ?? "Assignment"}
                    </p>,
                    <Badge key={`${caseItem.id}-priority`} tone={caseItem.aiConfidence > 0.8 ? "warning" : "danger"}>
                      {caseItem.aiConfidence > 0.8 ? "Medium" : "High"}
                    </Badge>,
                    <p key={`${caseItem.id}-reason`} className="max-w-xs text-sm text-muted-foreground">
                      {caseItem.previewSummary}
                    </p>,
                    <Button key={`${caseItem.id}-open`} size="sm" variant="secondary" onClick={() => router.push(`/cases/${caseItem.id}/review`)}>
                      Open review
                    </Button>,
                  ])}
                />
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-foreground">Recent activity</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Imports, generated cases, completed sessions, and finished reviews.
                    </p>
                  </div>
                  <Clock3 className="size-4 text-primary" />
                </div>
                <div className="space-y-4">
                  {dashboardQuery.data?.recentActivity.map((activity) => (
                    <div key={activity.id} className="rounded-3xl border border-border/60 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-foreground">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.createdAt.slice(0, 10)}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{activity.detail}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                <InlineSearch value={search} onChange={setSearch} placeholder="Search assignments, families, or status" />
                <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-white/5 px-4">
                  <Filter className="size-4 text-muted-foreground" />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                    className="h-11 w-full bg-transparent text-sm text-foreground outline-none"
                  >
                    <option value="all">All statuses</option>
                    <option value="ready">Ready</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <Button variant="secondary" onClick={() => setOpenCreate(true)}>
                <Plus className="size-4" />
                New Assignment
              </Button>
            </div>
          </Card>

          {filteredAssignments.length === 0 ? (
            <EmptyState
              title="No assignments match this filter"
              description="Create a new assignment or loosen the current search and status filters."
              action={<Button onClick={() => setOpenCreate(true)}>Create assignment</Button>}
            />
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {filteredAssignments.map((assignment) => (
                <Card key={assignment.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="neutral">{assignment.family.replaceAll("_", " ")}</Badge>
                        <StatusBadge status={assignment.status} />
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold text-foreground">{assignment.title}</h2>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {assignment.aiSummary}
                      </p>
                    </div>
                    <Badge tone={assignment.pendingReviewCount ? "warning" : "success"}>
                      {assignment.pendingReviewCount ? "Pending reviews" : "Review queue clear"}
                    </Badge>
                  </div>
                  <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    <Metric label="Artifacts" value={assignment.artifactCount} />
                    <Metric label="Student cases" value={assignment.caseCount} />
                    <Metric label="Completed sessions" value={assignment.completedSessionCount} />
                    <Metric label="Pending reviews" value={assignment.pendingReviewCount} />
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Updated {assignment.updatedAt.slice(0, 10)}
                    </p>
                    <Link href={`/assignments/${assignment.id}`}>
                      <Button>
                        Open assignment
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </ReviewerShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ArrowBadge({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
      {text}
    </div>
  );
}
