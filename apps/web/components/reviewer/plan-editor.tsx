"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

import { Badge, Button, Input, Panel, Textarea } from "@oralv/ui";

import { apiGet, apiPost, apiPut } from "@/lib/api";

interface EditableQuestion {
  id?: string;
  sequence: number;
  prompt: string;
  rationale: string;
  evaluation_target: string;
  expected_signal?: string | null;
  prep_seconds: number;
  response_seconds: number;
  branch_condition_json: Record<string, unknown>;
}

export function PlanEditor({ submissionId }: { submissionId: string }) {
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [notes, setNotes] = useState("");
  const [settings, setSettings] = useState({ prep_seconds: 45, response_seconds: 150, attempts: 1 });
  const query = useQuery({
    queryKey: ["submission-plan", submissionId],
    queryFn: () =>
      apiGet<{
        submission: { student_name: string; student_email: string; status: string };
        plan: {
          id: string;
          status: string;
          version_number: number;
          focus_graph_json: Record<string, unknown>;
          plan_json: Record<string, unknown>;
          settings_json: Record<string, unknown>;
          reviewer_notes?: string | null;
        };
        questions: EditableQuestion[];
        session: { id: string; status: string; public_token: string } | null;
      }>(`/plans/submission/${submissionId}`)
  });

  useEffect(() => {
    if (!query.data) return;
    setQuestions(query.data.questions);
    setNotes(query.data.plan.reviewer_notes ?? "");
    setSettings({
      prep_seconds: Number(query.data.plan.settings_json.prep_seconds ?? 45),
      response_seconds: Number(query.data.plan.settings_json.response_seconds ?? 150),
      attempts: Number(query.data.plan.settings_json.attempts ?? 1)
    });
  }, [query.data]);

  const focusItems = useMemo(() => {
    const nodes = query.data?.plan.focus_graph_json.nodes;
    return Array.isArray(nodes) ? nodes : [];
  }, [query.data?.plan.focus_graph_json.nodes]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiPut(`/plans/${query.data?.plan.id}`, {
        focus_graph_json: query.data?.plan.focus_graph_json ?? {},
        plan_json: query.data?.plan.plan_json ?? {},
        settings_json: settings,
        reviewer_notes: notes,
        questions
      })
  });
  const publishMutation = useMutation({
    mutationFn: () => apiPost<{ public_token: string }>(`/plans/${query.data?.plan.id}/publish`)
  });

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Defense plan</p>
            <h2 className="mt-3 text-3xl font-semibold">{query.data?.submission.student_name}</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">{query.data?.submission.student_email}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge>{query.data?.plan.status}</Badge>
            {publishMutation.data?.public_token || query.data?.session?.public_token ? (
              <Link href={`/s/${publishMutation.data?.public_token ?? query.data?.session?.public_token}`} target="_blank">
                <Button variant="ghost">Open session link</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </Panel>

      <section className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <Panel className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Focus graph</p>
            <h3 className="mt-2 text-xl font-semibold">Reviewer-editable focus points</h3>
          </div>
          {focusItems.map((item, index) => (
            <div key={index} className="rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-4">
              <p className="text-sm font-medium">{String((item as { target?: string }).target ?? `Focus ${index + 1}`)}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{String((item as { claim?: string }).claim ?? "")}</p>
            </div>
          ))}
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={String(settings.prep_seconds)}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSettings((current) => ({ ...current, prep_seconds: Number(event.target.value) }))
              }
            />
            <Input
              value={String(settings.response_seconds)}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSettings((current) => ({ ...current, response_seconds: Number(event.target.value) }))
              }
            />
            <Input
              value={String(settings.attempts)}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSettings((current) => ({ ...current, attempts: Number(event.target.value) }))
              }
            />
          </div>
          <Textarea
            placeholder="Reviewer notes"
            value={notes}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNotes(event.target.value)}
          />
        </Panel>
        <Panel className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Questions</p>
              <h3 className="mt-2 text-xl font-semibold">Defense sequence</h3>
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                setQuestions((current) => [
                  ...current,
                  {
                    sequence: current.length + 1,
                    prompt: "Describe the reasoning behind your key decision.",
                    rationale: "Checks genuine ownership of the submission.",
                    evaluation_target: "Reasoning",
                    expected_signal: "Specific references and tradeoffs",
                    prep_seconds: 45,
                    response_seconds: 150,
                    branch_condition_json: {}
                  }
                ])
              }
            >
              <Plus className="h-4 w-4" />
              Add question
            </Button>
          </div>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={`${question.id ?? "new"}-${index}`} className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Badge>Q{index + 1}</Badge>
                  <Button
                    variant="subtle"
                    onClick={() => setQuestions((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={question.prompt}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setQuestions((current) =>
                      current.map((item, currentIndex) =>
                        currentIndex === index ? { ...item, prompt: event.target.value } : item
                      )
                    )
                  }
                />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Input
                    value={question.evaluation_target}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setQuestions((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index
                            ? { ...item, evaluation_target: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                  <Input
                    value={question.expected_signal ?? ""}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setQuestions((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index
                            ? { ...item, expected_signal: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                </div>
                <Textarea
                  className="mt-3 min-h-[96px]"
                  value={question.rationale}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setQuestions((current) =>
                      current.map((item, currentIndex) =>
                        currentIndex === index ? { ...item, rationale: event.target.value } : item
                      )
                    )
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? "Saving..." : "Save plan"}
            </Button>
            <Button onClick={() => publishMutation.mutate()} variant="ghost">
              {publishMutation.isPending ? "Publishing..." : "Publish session"}
            </Button>
          </div>
        </Panel>
      </section>
    </div>
  );
}
