"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, FileScan, GitBranchPlus, RefreshCw } from "lucide-react";
import type { ArtifactKind } from "@oralv/types";

import { Badge, Button, Panel } from "@oralv/ui";

import { apiGet, apiPost } from "@/lib/api";
import { titleize } from "@/lib/format";

export function CaseDetail({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const caseQuery = useQuery({
    queryKey: ["case", caseId],
    queryFn: () =>
      apiGet<{
        case: { id: string; title: string; description: string; status: string; assignment_family: string };
        artifacts: Array<{
          id: string;
          kind: ArtifactKind;
          filename: string;
          signed_url: string;
          classification_confidence: number;
        }>;
        parsed_artifacts: Array<{
          artifact_id: string;
          normalized_text: string;
          normalized_json: Record<string, unknown>;
          low_text_confidence: boolean;
        }>;
        submissions: Array<{ id: string; student_name: string; status: string; student_email: string }>;
      }>(`/cases/${caseId}`)
  });
  const planQuery = useQuery({
    queryKey: ["case-plans", caseId],
    queryFn: () =>
      apiGet<{
        plans: Array<{ id: string; submission_record_id: string; status: string; version_number: number }>;
      }>(`/cases/${caseId}/plans`)
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiPost(`/cases/${caseId}/process`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["case", caseId] }),
        queryClient.invalidateQueries({ queryKey: ["case-plans", caseId] })
      ]);
    }
  });

  const artifacts = caseQuery.data?.artifacts ?? [];
  const parsedByArtifact = useMemo(
    () => new Map((caseQuery.data?.parsed_artifacts ?? []).map((item) => [item.artifact_id, item])),
    [caseQuery.data?.parsed_artifacts]
  );
  const selectedArtifact =
    artifacts.find((item) => item.id === selectedArtifactId) ?? artifacts[0] ?? null;
  const selectedParsed = selectedArtifact ? parsedByArtifact.get(selectedArtifact.id) : null;
  const planBySubmission = new Map(
    (planQuery.data?.plans ?? []).map((item) => [item.submission_record_id, item])
  );

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Assessment case</p>
            <h2 className="mt-3 text-3xl font-semibold">{caseQuery.data?.case.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              {caseQuery.data?.case.description}
            </p>
          </div>
          <div className="flex gap-3">
            <Badge>{titleize(caseQuery.data?.case.status ?? "loading")}</Badge>
            <Button onClick={() => refreshMutation.mutate()} variant="ghost">
              <RefreshCw className="h-4 w-4" />
              Re-run processing
            </Button>
          </div>
        </div>
      </Panel>

      <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <Panel className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Artifact review</p>
              <h3 className="mt-2 text-xl font-semibold">Classification and previews</h3>
            </div>
            <Badge>{artifacts.length} files</Badge>
          </div>
          <div className="space-y-3">
            {artifacts.map((artifact) => (
              <button
                className={`w-full rounded-[22px] border p-4 text-left transition ${selectedArtifact?.id === artifact.id ? "border-[var(--accent)] bg-[var(--accent)]/8" : "border-[var(--line)] bg-[var(--panel)]"}`}
                key={artifact.id}
                onClick={() => setSelectedArtifactId(artifact.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{artifact.filename}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{artifact.kind}</p>
                  </div>
                  <Badge>{Math.round((artifact.classification_confidence ?? 0) * 100)}%</Badge>
                </div>
              </button>
            ))}
          </div>
        </Panel>
        <Panel className="overflow-hidden">
          {selectedArtifact ? (
            <div className="grid gap-5 xl:grid-cols-[0.84fr_1fr]">
              <div className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">Source file</p>
                    <p className="mt-2 font-medium">{selectedArtifact.filename}</p>
                  </div>
                  <Link className="text-sm text-[var(--accent)]" href={selectedArtifact.signed_url} target="_blank">
                    Open file
                  </Link>
                </div>
                <iframe className="mt-4 h-[520px] w-full rounded-[18px] bg-white/80" src={selectedArtifact.signed_url} title={selectedArtifact.filename} />
              </div>
              <div className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-4">
                <div className="flex items-center gap-3">
                  <FileScan className="h-5 w-5 text-[var(--accent)]" />
                  <div>
                    <p className="font-medium">Normalized extraction</p>
                    <p className="text-sm text-[var(--muted)]">
                      {selectedParsed?.low_text_confidence ? "Low text confidence detected." : "Parsed into structured sections."}
                    </p>
                  </div>
                </div>
                <pre className="mt-5 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-[20px] border border-[var(--line)] bg-[var(--panel-strong)] p-4 text-sm leading-7 text-[var(--muted)]">
                  {selectedParsed?.normalized_text ?? "Parsing results will appear here after ingestion."}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No artifacts uploaded yet.</p>
          )}
        </Panel>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Submission queue</p>
            <h3 className="mt-2 text-2xl font-semibold">Defense plan processing</h3>
          </div>
        </div>
        {caseQuery.data?.submissions.map((submission) => {
          const plan = planBySubmission.get(submission.id);
          return (
            <Panel key={submission.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold">{submission.student_name}</h4>
                    <Badge>{titleize(submission.status)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">{submission.student_email}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {plan ? (
                    <Link href={`/app/submissions/${submission.id}/plan`}>
                      <Button variant="ghost">
                        Open plan
                        <GitBranchPlus className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : null}
                  <Link href={`/app/submissions/${submission.id}/review`}>
                    <Button>
                      Reviewer workspace
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Panel>
          );
        })}
      </section>
    </div>
  );
}
