"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Upload, WandSparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  ArtifactBoard,
  ArtifactCard,
  Badge,
  Button,
  Card,
  CasesTable,
  ConfidenceBadge,
  EmptyState,
  ErrorAlert,
  ExplainabilityPopover,
  FocusPointCard,
  LoadingSkeleton,
  PageHeader,
  PreviewSummaryCell,
  ProcessingTimeline,
  SessionLinkCell,
  SplitPaneLayout,
  StatusBadge,
  UploadDropzone,
  VerificationGoalChip,
} from "@concentra/ui";

import { ReviewerShell } from "@/components/reviewer-shell";
import { api, uploadFile } from "@/lib/api";
import { env } from "@/lib/env";

type GoalFormState = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  order: number;
  confidence: number;
  explainability?: any;
};

export default function AssignmentWorkspacePage() {
  const params = useParams<{ assignmentId: string }>();
  const queryClient = useQueryClient();
  const assignmentId = params.assignmentId;
  const artifactInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [goalState, setGoalState] = useState<GoalFormState[]>([]);
  const [sessionDefaults, setSessionDefaults] = useState<any | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [mappingDrafts, setMappingDrafts] = useState<Record<string, string>>({});

  const assignmentQuery = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => api.assignment(assignmentId),
  });

  const assignment = assignmentQuery.data;
  const latestImport = assignment?.imports?.[0];
  const unresolvedItems = latestImport?.importedArtifacts?.filter((item: any) => item.unresolvedReason) ?? [];

  useEffect(() => {
    if (!assignment) return;
    setGoalState(assignment.verificationGoals ?? []);
    setSessionDefaults(assignment.sessionDefaults);
    setRenameValue(assignment.title);
  }, [assignment]);

  const saveAssignmentMutation = useMutation({
    mutationFn: (payload: any) => api.patchAssignment(assignmentId, payload),
    onSuccess: () => {
      toast.success("Assignment updated");
      queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save assignment");
    },
  });

  async function handleArtifactUpload(files: FileList) {
    try {
      for (const file of Array.from(files)) {
        const target = await api.artifactUploadUrl(assignmentId, {
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          contentLength: file.size,
        });
        await uploadFile(
          target.uploadUrl,
          file,
          file.type || "application/octet-stream",
          target.headers,
        );
        await api.registerArtifact(assignmentId, {
          fileName: file.name,
          storagePath: target.storagePath,
          mimeType: file.type || "application/octet-stream",
          originalSize: file.size,
        });
      }
      await api.analyzeArtifacts(assignmentId);
      toast.success("Artifacts uploaded and analyzed");
      queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload assignment artifacts");
    }
  }

  async function handleImportUpload(files: FileList) {
    try {
      const registeredItems = [];
      for (const file of Array.from(files)) {
        const target = await api.importUploadUrl(assignmentId, {
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          contentLength: file.size,
        });
        await uploadFile(
          target.uploadUrl,
          file,
          file.type || "application/octet-stream",
          target.headers,
        );
        registeredItems.push({
          fileName: file.name,
          storagePath: target.storagePath,
          mimeType: file.type || "application/octet-stream",
          originalSize: file.size,
        });
      }
      const importJob = await api.registerImportBatch(assignmentId, {
        items: registeredItems,
        sourceType: "mixed",
        rosterCsvPath: null,
      });
      await api.analyzeImport(assignmentId, importJob.id);
      toast.success("Submission batch analyzed");
      queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import student submissions");
    }
  }

  async function handleCreateCases() {
    if (!latestImport) return;
    try {
      await api.createCases(assignmentId, latestImport.id);
      toast.success("Student cases created");
      queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create cases");
    }
  }

  async function handleFixMapping(importItemId: string) {
    if (!latestImport) return;
    const value = mappingDrafts[importItemId];
    if (!value) return;
    try {
      await api.fixImportMapping(assignmentId, latestImport.id, {
        importItemId,
        matchedStudentIdentifier: value,
        bundleId: `bundle_${value.toLowerCase()}`,
      });
      toast.success("Mapping updated");
      queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to fix mapping");
    }
  }

  const pendingReviewCount = assignment?.cases?.filter((item: any) => item.reviewStatus === "needs_review").length ?? 0;

  const caseRows = useMemo(
    () =>
      (assignment?.cases ?? []).map((caseItem: any) => [
        <div key={`${caseItem.id}-student`} className="space-y-1">
          <p className="font-medium text-foreground">{caseItem.studentName ?? caseItem.studentIdentifier}</p>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{caseItem.studentIdentifier}</p>
        </div>,
        <Badge key={`${caseItem.id}-family`} tone="neutral">
          {caseItem.submissionFamily.replaceAll("_", " ")}
        </Badge>,
        <div key={`${caseItem.id}-artifacts`} className="text-sm text-muted-foreground">
          {caseItem.bundleArtifactIds.length} artifacts
        </div>,
        <ConfidenceBadge key={`${caseItem.id}-confidence`} value={caseItem.aiConfidence} />,
        <SessionLinkCell
          key={`${caseItem.id}-link`}
          link={`${env.NEXT_PUBLIC_APP_URL}/session/${caseItem.sessionLinkToken}`}
          onCopy={() => navigator.clipboard.writeText(`${env.NEXT_PUBLIC_APP_URL}/session/${caseItem.sessionLinkToken}`)}
        />,
        <StatusBadge key={`${caseItem.id}-session`} status={caseItem.sessionStatus} />,
        <StatusBadge key={`${caseItem.id}-review`} status={caseItem.reviewStatus} />,
        <PreviewSummaryCell
          key={`${caseItem.id}-preview`}
          summary={caseItem.previewSummary}
          flags={caseItem.previewFlags.map((flag: any) => ({ label: flag.label, tone: flag.tone }))}
        />,
        <div key={`${caseItem.id}-actions`} className="flex flex-col gap-2">
          <Button size="sm" variant="secondary" onClick={async () => {
            const result = await api.regenerateSessionLink(caseItem.id);
            navigator.clipboard.writeText(`${env.NEXT_PUBLIC_APP_URL}/session/${result.token}`);
            toast.success("Session link refreshed and copied");
            queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
          }}>
            Refresh link
          </Button>
          <Link href={`/cases/${caseItem.id}/review`}>
            <Button size="sm">
              Open result
            </Button>
          </Link>
        </div>,
      ]) ?? [],
    [assignment?.cases, assignmentId, queryClient],
  );

  return (
    <ReviewerShell>
      {assignmentQuery.isLoading ? (
        <LoadingSkeleton lines={6} />
      ) : assignmentQuery.error ? (
        <ErrorAlert
          title="Unable to load assignment workspace"
          description={assignmentQuery.error instanceof Error ? assignmentQuery.error.message : "Refresh the page to try again."}
          onRetry={() => assignmentQuery.refetch()}
        />
      ) : assignment ? (
        <div className="space-y-6">
          <PageHeader
            title={assignment.title}
            subtitle="Assignment intelligence, student bundle import, oral session launch, and case review all stay inside the assignment workspace."
            action={
              <div className="flex flex-wrap gap-2">
                <input ref={artifactInputRef} type="file" className="hidden" multiple onChange={(event) => event.target.files && handleArtifactUpload(event.target.files)} />
                <input ref={importInputRef} type="file" className="hidden" multiple onChange={(event) => event.target.files && handleImportUpload(event.target.files)} />
                <Button variant="secondary" onClick={() => artifactInputRef.current?.click()}>
                  <Upload className="size-4" />
                  Upload assignment artifacts
                </Button>
                <Button variant="secondary" onClick={() => importInputRef.current?.click()}>
                  <Plus className="size-4" />
                  Import student submissions
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const nextTitle = window.prompt("Rename assignment", renameValue);
                    if (!nextTitle) return;
                    setRenameValue(nextTitle);
                    saveAssignmentMutation.mutate({ title: nextTitle });
                  }}
                >
                  <Pencil className="size-4" />
                  Rename assignment
                </Button>
              </div>
            }
          />

          <Card className="p-5">
            <div className="grid gap-4 lg:grid-cols-6">
              {[
                ["Family", assignment.family.replaceAll("_", " ")],
                ["Status", assignment.status],
                ["Artifacts", `${assignment.artifactCount}`],
                ["Cases", `${assignment.caseCount}`],
                ["Completed sessions", `${assignment.completedSessionCount}`],
                ["Pending review", `${pendingReviewCount}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <SplitPaneLayout
            left={
              <div className="space-y-6">
                <ArtifactBoard
                  title="Assignment intelligence"
                  description="Artifacts are role-classified, summarized, and linked to explainable verification goals."
                >
                  {(assignment.artifacts?.length ?? 0) > 0 ? (
                    assignment.artifacts.map((artifact: any) => (
                      <ArtifactCard
                        key={artifact.id}
                        title={artifact.fileName}
                        role={artifact.role}
                        confidence={artifact.roleConfidence}
                        summary={artifact.previewMetadata?.summary ?? artifact.extractedText?.slice(0, 140)}
                        actions={
                          <select
                            value={artifact.role}
                            onChange={async (event) => {
                              await api.patchArtifact(assignmentId, artifact.id, { role: event.target.value, detectedRole: event.target.value });
                              queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
                            }}
                            className="rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground outline-none"
                          >
                            {[
                              "assignment_brief",
                              "rubric",
                              "teacher_note",
                              "model_answer",
                              "support_material",
                            ].map((option) => (
                              <option key={option} value={option}>
                                {option.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                        }
                      />
                    ))
                  ) : (
                    <EmptyState
                      title="No assignment artifacts yet"
                      description="Upload a brief, rubric, notes, or model answer to generate assignment understanding and reviewer goals."
                      action={
                        <Button variant="secondary" onClick={() => artifactInputRef.current?.click()}>
                          Upload artifacts
                        </Button>
                      }
                    />
                  )}
                </ArtifactBoard>

                <Card className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground">AI assignment summary</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{assignment.aiSummary}</p>
                    </div>
                    <ConfidenceBadge value={assignment.aiSummaryConfidence} />
                  </div>
                  <div className="mt-4">
                    <ExplainabilityPopover summary={assignment.assignmentUnderstanding?.explainability?.why ?? "Derived from assignment artifacts and rubric language."}>
                      <div className="space-y-3">
                        {(assignment.assignmentUnderstanding?.explainability?.referencedSources ?? []).map((source: any) => (
                          <div key={source.label} className="rounded-2xl bg-white/5 p-3 text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">{source.label}</p>
                            <p className="mt-1">{source.excerpt}</p>
                          </div>
                        ))}
                      </div>
                    </ExplainabilityPopover>
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-foreground">Verification goals</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Edit the assignment-level goals the AI will use when creating per-student oral verification cases.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setGoalState((current) => [
                          ...current,
                          {
                            id: `goal_custom_${current.length + 1}`,
                            label: "Custom verification goal",
                            description: "Add reviewer-specific context.",
                            enabled: true,
                            order: current.length + 1,
                            confidence: 0.72,
                          },
                        ])
                      }
                    >
                      <Plus className="size-4" />
                      Add goal
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {goalState.map((goal, index) => (
                      <div key={goal.id} className="rounded-3xl border border-border/60 bg-white/5 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="grid flex-1 gap-3 md:grid-cols-[1fr_1.2fr]">
                            <input
                              value={goal.label}
                              onChange={(event) =>
                                setGoalState((current) =>
                                  current.map((item) => (item.id === goal.id ? { ...item, label: event.target.value } : item)),
                                )
                              }
                              className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
                            />
                            <input
                              value={goal.description}
                              onChange={(event) =>
                                setGoalState((current) =>
                                  current.map((item) => (item.id === goal.id ? { ...item, description: event.target.value } : item)),
                                )
                              }
                              className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="rounded-xl border border-border/70 px-3 py-2 text-sm text-muted-foreground"
                              onClick={() =>
                                setGoalState((current) =>
                                  current.map((item) => (item.id === goal.id ? { ...item, enabled: !item.enabled } : item)),
                                )
                              }
                            >
                              {goal.enabled ? "Disable" : "Enable"}
                            </button>
                            <button
                              className="rounded-xl border border-border/70 px-3 py-2 text-sm text-muted-foreground"
                              disabled={index === 0}
                              onClick={() =>
                                setGoalState((current) => {
                                  if (index === 0) return current;
                                  const next = [...current];
                                  const previous = next[index - 1];
                                  const currentGoal = next[index];
                                  if (!previous || !currentGoal) return current;
                                  next[index - 1] = currentGoal;
                                  next[index] = previous;
                                  return next;
                                })
                              }
                            >
                              Move up
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <VerificationGoalChip label={goal.label} enabled={goal.enabled} detail={goal.description} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-foreground">Session defaults</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Keep reviewer setup lightweight: tune the session once at assignment level.
                      </p>
                    </div>
                    <Badge tone="primary">Audio-first</Badge>
                  </div>
                  {sessionDefaults ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Number of questions</label>
                        <input
                          type="number"
                          min={3}
                          max={8}
                          value={sessionDefaults.questionCount}
                          onChange={(event) =>
                            setSessionDefaults((current: any) => ({ ...current, questionCount: Number(event.target.value) }))
                          }
                          className="w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Answer duration (seconds)</label>
                        <input
                          type="number"
                          min={30}
                          max={300}
                          value={sessionDefaults.answerDurationSeconds}
                          onChange={(event) =>
                            setSessionDefaults((current: any) => ({ ...current, answerDurationSeconds: Number(event.target.value) }))
                          }
                          className="w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Allow re-record</label>
                        <select
                          value={String(sessionDefaults.allowRerecord)}
                          onChange={(event) =>
                            setSessionDefaults((current: any) => ({ ...current, allowRerecord: event.target.value === "true" }))
                          }
                          className="w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Response mode</label>
                        <select
                          value={sessionDefaults.responseMode}
                          onChange={(event) =>
                            setSessionDefaults((current: any) => ({ ...current, responseMode: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
                        >
                          <option value="audio_only">Audio only</option>
                          <option value="audio_video">Audio + video</option>
                        </select>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-4 flex justify-end">
                    <Button
                      loading={saveAssignmentMutation.isPending}
                      onClick={() =>
                        saveAssignmentMutation.mutate({
                          title: renameValue,
                          verificationGoals: goalState,
                          sessionDefaults,
                        })
                      }
                    >
                      Save reviewer defaults
                    </Button>
                  </div>
                </Card>
              </div>
            }
            right={
              <div className="space-y-6">
                <Card className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground">Student submission import</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Batch import LMS exports, drag in mixed files, and let Concentra auto-group them into student cases.
                      </p>
                    </div>
                    <Badge tone="primary">Assignment-scoped import</Badge>
                  </div>
                  <UploadDropzone
                    title="Drop ZIPs, local files, or roster exports"
                    description="Concentra will classify files, detect student identifiers, group bundles, and prepare case generation inside this assignment."
                    onFiles={handleImportUpload}
                  />

                  {latestImport ? (
                    <div className="mt-6 space-y-5">
                      <ProcessingTimeline
                        labels={latestImport.stageLabels}
                        currentIndex={latestImport.status === "completed" ? latestImport.stageLabels.length - 1 : latestImport.status === "ready" ? 3 : latestImport.status === "analyzing" ? 1 : 0}
                      />

                      <div className="grid gap-3">
                        {(latestImport.detectedBundles ?? []).map((bundle: any) => (
                          <Card key={bundle.bundleId} className="p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-foreground">{bundle.studentName ?? bundle.studentIdentifier}</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {bundle.fileCount} files · {bundle.submissionFamily.replaceAll("_", " ")}
                                </p>
                              </div>
                              <ConfidenceBadge value={bundle.confidence} />
                            </div>
                          </Card>
                        ))}
                      </div>

                      {unresolvedItems.length > 0 ? (
                        <Card className="border-warning/30 bg-warning/10 p-4">
                          <p className="font-medium text-foreground">Unresolved items</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Fix ambiguous mappings inline, then create student cases.
                          </p>
                          <div className="mt-4 space-y-3">
                            {unresolvedItems.map((item: any) => (
                              <div key={item.id} className="rounded-2xl bg-black/20 p-4">
                                <p className="font-medium text-foreground">{item.fileName}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{item.unresolvedReason}</p>
                                <div className="mt-3 flex gap-2">
                                  <input
                                    value={mappingDrafts[item.id] ?? ""}
                                    onChange={(event) =>
                                      setMappingDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                                    }
                                    placeholder="Student identifier"
                                    className="flex-1 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
                                  />
                                  <Button variant="secondary" onClick={() => handleFixMapping(item.id)}>
                                    Apply
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ) : null}

                      <Button className="w-full" onClick={handleCreateCases} disabled={latestImport.status === "blocked"}>
                        <WandSparkles className="size-4" />
                        Create student cases
                      </Button>
                    </div>
                  ) : (
                    <EmptyState
                      title="No submission batch yet"
                      description="Once you import student files, the workspace will show the processing timeline, detected bundles, and inline mapping controls here."
                      action={
                        <Button variant="secondary" onClick={() => importInputRef.current?.click()}>
                          Import submissions
                        </Button>
                      }
                    />
                  )}
                </Card>
              </div>
            }
          />

          <Card className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">Case list</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every student case, session link, status, and reviewer result stays inside this assignment workspace.
                </p>
              </div>
              <Badge tone="neutral">{assignment.caseCount} cases</Badge>
            </div>
            {assignment.cases?.length ? (
              <CasesTable
                headers={["Student", "Submission family", "Artifacts", "AI confidence", "Session link", "Session status", "Review status", "Preview", "Open result"]}
                rows={caseRows}
              />
            ) : (
              <EmptyState
                title="No student cases yet"
                description="Import a submission batch, confirm the detected bundles, and create cases to generate student session links."
                action={<Button onClick={() => importInputRef.current?.click()}>Import submissions</Button>}
              />
            )}
          </Card>
        </div>
      ) : null}
    </ReviewerShell>
  );
}
