"use client";

import { useState, type ChangeEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

import { Badge, Button, Input, Panel, Textarea } from "@oralv/ui";

import { apiGet, apiPost } from "@/lib/api";
import { titleize } from "@/lib/format";

const verdicts = [
  "verified",
  "requires_follow_up",
  "insufficient_evidence"
] as const;

export function ReviewWorkspace({ submissionId }: { submissionId: string }) {
  const [verdict, setVerdict] = useState<(typeof verdicts)[number]>("verified");
  const [summary, setSummary] = useState("");
  const [note, setNote] = useState("");

  const query = useQuery({
    queryKey: ["review-workspace", submissionId],
    queryFn: () =>
      apiGet<{
        case: { id: string; title: string };
        submission: { student_name: string; student_email: string; status: string };
        plan: { id: string; status: string };
        session: { id: string; status: string; public_token: string } | null;
        competencies: Array<{ id: string; label: string; status: string; score: number; summary: string }>;
        evidence: Array<{ id: string; title: string; status: string; evidence_snippet: string; confidence: number; rationale: string }>;
        responses: Array<{ id: string; sequence: number; transcript_text?: string | null }>;
        transcript_segments: Array<{ id: string; start_ms: number; text: string; confidence: number }>;
        decision?: { verdict: string; summary: string; reviewer_note?: string | null } | null;
        artifacts: Array<{ id: string; kind: string; filename: string; signed_url: string }>;
      }>(`/decisions/submissions/${submissionId}`)
  });
  const decisionMutation = useMutation({
    mutationFn: () =>
      apiPost(`/decisions/submissions/${submissionId}`, {
        verdict,
        summary,
        reviewer_note: note
      })
  });

  const chartData = (query.data?.competencies ?? []).map((item, index) => ({
    index: index + 1,
    score: item.score
  }));

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Reviewer summary</p>
            <h2 className="mt-3 text-3xl font-semibold">{query.data?.submission.student_name}</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">{query.data?.case.title}</p>
          </div>
          <div className="flex gap-3">
            <Badge>{titleize(query.data?.submission.status ?? "loading")}</Badge>
            {query.data?.decision ? <Badge>{titleize(query.data.decision.verdict)}</Badge> : null}
          </div>
        </div>
      </Panel>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Competency status</p>
              <h3 className="mt-2 text-xl font-semibold">Outcome first</h3>
            </div>
          </div>
          <div className="mt-6 h-48 rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="var(--accent)" fill="url(#scoreFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 space-y-3">
            {(query.data?.competencies ?? []).map((item) => (
              <div key={item.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{item.label}</p>
                  <Badge>{titleize(item.status)}</Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.summary}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Evidence snippets</p>
            <h3 className="mt-2 text-xl font-semibold">Transcript-aligned signal</h3>
          </div>
          {(query.data?.evidence ?? []).map((item) => (
            <div key={item.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{item.title}</p>
                <Badge>{titleize(item.status)}</Badge>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--ink)]">{item.evidence_snippet}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                Confidence {(item.confidence * 100).toFixed(0)}%
              </p>
            </div>
          ))}
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.94fr]">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Transcript drilldown</p>
          <div className="mt-5 space-y-3">
            {(query.data?.transcript_segments ?? []).map((item) => (
              <div key={item.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge>{Math.round(item.start_ms / 1000)}s</Badge>
                  <span className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    {(item.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.text}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Final decision</p>
          <h3 className="mt-2 text-xl font-semibold">Commit reviewer judgment</h3>
          <div className="mt-5 grid gap-3">
            <select
              className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm"
              onChange={(event) => setVerdict(event.target.value as (typeof verdicts)[number])}
              value={verdict}
            >
              {verdicts.map((item) => (
                <option key={item} value={item}>
                  {titleize(item)}
                </option>
              ))}
            </select>
            <Input
              placeholder="Decision summary"
              value={summary}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setSummary(event.target.value)}
            />
            <Textarea
              placeholder="Reviewer note"
              value={note}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)}
            />
            <Button onClick={() => decisionMutation.mutate()}>
              {decisionMutation.isPending ? "Saving..." : "Finalize decision"}
            </Button>
          </div>
        </Panel>
      </section>
    </div>
  );
}
