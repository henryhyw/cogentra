"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CircleDashed, Search } from "lucide-react";
import type { ChangeEvent } from "react";

import type { CaseSummary } from "@oralv/types";
import { Badge, Button, Input, Panel } from "@oralv/ui";

import { apiGet } from "@/lib/api";
import { fromNow, titleize } from "@/lib/format";

export function DashboardOverview() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const casesQuery = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiGet<{ cases: CaseSummary[] }>("/cases")
  });
  const analyticsQuery = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () =>
      apiGet<{
        total_cases: number;
        total_submissions: number;
        completed_sessions: number;
        finalized_decisions: number;
        unresolved_competencies: number;
        publish_to_decision_days: number;
      }>("/analytics/overview")
  });

  const filteredCases = useMemo(() => {
    const items = casesQuery.data?.cases ?? [];
    if (!deferredSearch) return items;
    return items.filter((item) =>
      `${item.title} ${item.course_name ?? ""}`.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [casesQuery.data?.cases, deferredSearch]);

  const metrics = analyticsQuery.data
    ? [
        ["Active cases", analyticsQuery.data.total_cases],
        ["Submissions", analyticsQuery.data.total_submissions],
        ["Completed sessions", analyticsQuery.data.completed_sessions],
        ["Finalized decisions", analyticsQuery.data.finalized_decisions]
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="overflow-hidden">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Operating queue</p>
              <h2 className="mt-3 text-3xl font-semibold">Summary-first review across cases and submissions.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                Move from uploaded work to reviewer judgment with structured defense plans, async oral sessions, and evidence-driven decisions.
              </p>
            </div>
            <Link href="/app/cases/new">
              <Button size="lg">
                Create assessment case
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{label}</p>
                <p className="mt-3 text-3xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="bg-[linear-gradient(180deg,rgba(188,135,82,0.16),transparent_65%),var(--panel)]">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Decision velocity</p>
          <p className="mt-4 text-5xl font-semibold">
            {analyticsQuery.data?.publish_to_decision_days ?? "1.8"}
            <span className="ml-2 text-base font-medium text-[var(--muted)]">days</span>
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Median time from published session to final reviewer decision across current seeded cases.
          </p>
        </Panel>
      </section>
      <section className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Assessment cases</p>
            <h3 className="mt-2 text-2xl font-semibold">Current queue</h3>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              className="pl-11"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
              placeholder="Search cases"
            />
          </div>
        </div>
        {filteredCases.length ? (
          <div className="grid gap-4">
            {filteredCases.map((item) => (
              <Link href={`/app/cases/${item.id}`} key={item.id}>
                <Panel className="transition hover:border-[var(--accent)] hover:shadow-[0_28px_90px_rgba(164,111,63,0.12)]">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-semibold">{item.title}</h4>
                        <Badge>{titleize(item.status)}</Badge>
                      </div>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                        {item.description ?? "No case description provided."}
                      </p>
                    </div>
                    <div className="text-right text-sm text-[var(--muted)]">
                      <p>{titleize(item.assignment_family)}</p>
                      <p className="mt-2">{fromNow(item.created_at)}</p>
                    </div>
                  </div>
                </Panel>
              </Link>
            ))}
          </div>
        ) : (
          <Panel className="py-16 text-center">
            <CircleDashed className="mx-auto h-10 w-10 text-[var(--muted)]" />
            <h4 className="mt-4 text-xl font-semibold">No cases found</h4>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Start with a new case or load the included demo content from the seed script.
            </p>
          </Panel>
        )}
      </section>
    </div>
  );
}
