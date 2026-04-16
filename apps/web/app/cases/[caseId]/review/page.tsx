"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, FileText, Search, ShieldAlert, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  ConfidenceBadge,
  EmptyState,
  ErrorAlert,
  EvidenceCard,
  FocusPointCard,
  InconsistencyCard,
  Input,
  PageHeader,
  ReviewMediaCard,
  ScrollArea,
  StatusBadge,
  SubmissionPreviewPanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TranscriptBlock,
} from "@concentra/ui";

import { ReviewerShell } from "@/components/reviewer-shell";
import { api } from "@/lib/api";
import { env } from "@/lib/env";

export default function CaseReviewPage() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [transcriptSearch, setTranscriptSearch] = useState("");

  const reviewQuery = useQuery({
    queryKey: ["case-review", caseId],
    queryFn: () => api.caseResult(caseId),
  });

  const reviewPayload = reviewQuery.data;
  const assignment = reviewPayload?.assignment;
  const caseItem = reviewPayload?.case;
  const result = reviewPayload?.result;
  const responses = caseItem?.responses ?? [];
  const filteredResponses = useMemo(() => {
    if (!transcriptSearch.trim()) return responses;
    return responses.filter((response: any) =>
      response.transcriptText.toLowerCase().includes(transcriptSearch.toLowerCase()),
    );
  }, [responses, transcriptSearch]);

  const saveNoteMutation = useMutation({
    mutationFn: () => api.updateReviewNote(caseId, note),
    onSuccess: () => {
      toast.success("Reviewer note saved");
      queryClient.invalidateQueries({ queryKey: ["case-review", caseId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save reviewer note");
    },
  });

  const markReviewedMutation = useMutation({
    mutationFn: () => api.markReviewed(caseId),
    onSuccess: () => {
      toast.success("Case marked as reviewed");
      queryClient.invalidateQueries({ queryKey: ["case-review", caseId] });
      queryClient.invalidateQueries({ queryKey: ["assignment", assignment?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to mark case as reviewed");
    },
  });

  const firstResponse = responses[0];
  const firstAudioPath = firstResponse?.audioPath;
  const firstVideoPath = firstResponse?.videoPath;
  const audioUrl =
    firstAudioPath && !firstAudioPath.startsWith("seed-audio/")
      ? `${env.NEXT_PUBLIC_API_BASE_URL}/api/files/${firstAudioPath}`
      : undefined;
  const videoUrl =
    firstVideoPath && !firstVideoPath.startsWith("seed-audio/")
      ? `${env.NEXT_PUBLIC_API_BASE_URL}/api/files/${firstVideoPath}`
      : undefined;

  function exportReport() {
    if (!assignment || !caseItem || !result) return;
    const report = [
      `# Concentra Review Report`,
      ``,
      `Assignment: ${assignment.title}`,
      `Student: ${caseItem.studentName ?? caseItem.studentIdentifier}`,
      `Submission family: ${caseItem.submissionFamily.replaceAll("_", " ")}`,
      `Review priority: ${result.reviewPriority}`,
      `Recommended action: ${result.recommendedAction}`,
      ``,
      `## Executive Summary`,
      result.executiveSummary,
      ``,
      `## Focus Points`,
      ...result.focusPointStatuses.flatMap((focus: any) => [
        `- ${focus.label} [${focus.status}]`,
        `  ${focus.summary}`,
      ]),
      ``,
      `## Evidence Cards`,
      ...result.evidenceCards.flatMap((item: any) => [
        `- ${item.title}`,
        `  Finding: ${item.finding}`,
        `  Submission reference: ${item.submissionReference}`,
        `  Transcript: ${item.transcriptSnippet}`,
      ]),
      ``,
      `## Inconsistencies`,
      ...(result.inconsistencies.length
        ? result.inconsistencies.flatMap((item: any) => [
            `- ${item.description}`,
            `  Reference: ${item.relatedSubmissionReference}`,
            `  Transcript: ${item.supportingTranscriptSnippet}`,
          ])
        : ["- No additional inconsistency flags"]),
      ``,
      `## Reviewer Note`,
      note || result.finalReviewerNote || "No reviewer note recorded.",
      ``,
    ].join("\n");

    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${assignment.title}-${caseItem.studentIdentifier}-concentra-review.md`
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-");
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Review report exported");
  }

  return (
    <ReviewerShell>
      {reviewQuery.isLoading ? (
        <div className="space-y-4">
          <Card className="h-28 animate-pulse bg-white/5" />
          <Card className="h-[32rem] animate-pulse bg-white/5" />
        </div>
      ) : reviewQuery.error ? (
        <ErrorAlert
          title="Unable to load review package"
          description={reviewQuery.error instanceof Error ? reviewQuery.error.message : "Refresh the page to try again."}
          onRetry={() => reviewQuery.refetch()}
        />
      ) : result && caseItem && assignment ? (
        <div className="space-y-6">
          <PageHeader
            title={caseItem.studentName ?? caseItem.studentIdentifier}
            subtitle={`${assignment.title} · Summary-first review package with evidence, transcript, and source-linked submission context.`}
            action={
              <div className="flex gap-2">
                <StatusBadge status={caseItem.reviewStatus} />
                <ConfidenceBadge value={caseItem.aiConfidence} />
              </div>
            }
          />

          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Case context</p>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Student</p>
                    <p className="mt-1 font-medium text-foreground">{caseItem.studentName ?? caseItem.studentIdentifier}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Assignment</p>
                    <p className="mt-1 text-foreground">{assignment.title}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Submission family</p>
                    <p className="mt-1 text-foreground">{caseItem.submissionFamily.replaceAll("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Session status</p>
                    <div className="mt-1">
                      <StatusBadge status={caseItem.sessionStatus} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Completion</p>
                    <p className="mt-1 text-foreground">{caseItem.session?.completedAt ?? "Awaiting session completion"}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Focus points</p>
                <div className="mt-4 space-y-3">
                  {result.focusPointStatuses.map((focus: any) => (
                    <a
                      key={focus.focusPointId}
                      href={`#${focus.focusPointId}`}
                      className="block rounded-2xl border border-border/70 bg-white/5 p-3 transition hover:bg-white/10"
                    >
                      <p className="font-medium text-foreground">{focus.label}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusBadge status={focus.status} />
                        <ConfidenceBadge value={focus.confidence} />
                      </div>
                    </a>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Jump links</p>
                <div className="mt-4 space-y-2 text-sm">
                  {[
                    ["Executive Summary", "#executive-summary"],
                    ["Focus Points", "#focus-points"],
                    ["Evidence Cards", "#evidence-cards"],
                    ["Inconsistencies", "#inconsistencies"],
                    ["Per-question breakdown", "#per-question"],
                    ["Transcript", "#transcript"],
                    ["Submission preview", "#submission-preview"],
                  ].map(([label, href]) => (
                    <a key={href} href={href} className="block rounded-xl px-3 py-2 text-muted-foreground transition hover:bg-white/5 hover:text-foreground">
                      {label}
                    </a>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card id="executive-summary" className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Executive summary</p>
                    <p className="mt-4 text-lg leading-8 text-foreground">{result.executiveSummary}</p>
                  </div>
                  <div className="space-y-2">
                    <Badge tone={result.reviewPriority === "high" ? "danger" : result.reviewPriority === "medium" ? "warning" : "success"}>
                      {result.reviewPriority} priority
                    </Badge>
                    <Badge tone="neutral">{result.recommendedAction}</Badge>
                  </div>
                </div>
              </Card>

              <section id="focus-points" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-foreground">Focus point status</h2>
                  <Badge tone="primary">
                    <Sparkles className="size-3" />
                    reviewer-first summary
                  </Badge>
                </div>
                {result.focusPointStatuses.map((focus: any) => (
                  <div key={focus.focusPointId} id={focus.focusPointId}>
                    <FocusPointCard
                      title={focus.label}
                      status={focus.status}
                      summary={focus.summary}
                      why={focus.whyItMatters}
                      confidence={focus.confidence}
                    />
                  </div>
                ))}
              </section>

              <section id="evidence-cards" className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Evidence cards</h2>
                {result.evidenceCards.map((evidence: any) => (
                  <EvidenceCard
                    key={evidence.id}
                    title={evidence.title}
                    finding={evidence.finding}
                    transcriptSnippet={evidence.transcriptSnippet}
                    submissionReference={evidence.submissionReference}
                    whyItMatters={evidence.whyItMatters}
                    confidence={evidence.confidence}
                  />
                ))}
              </section>

              <section id="inconsistencies" className="space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="size-5 text-warning-foreground" />
                  <h2 className="text-2xl font-semibold text-foreground">Possible inconsistencies</h2>
                </div>
                {result.inconsistencies.length ? (
                  result.inconsistencies.map((item: any) => (
                    <InconsistencyCard
                      key={item.id}
                      description={item.description}
                      transcriptSnippet={item.supportingTranscriptSnippet}
                      reference={item.relatedSubmissionReference}
                      confidence={item.confidence}
                    />
                  ))
                ) : (
                  <EmptyState
                    title="No inconsistency flags"
                    description="The oral responses did not trigger additional written-versus-oral mismatch flags in this case."
                  />
                )}
              </section>

              <section id="per-question" className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Per-question breakdown</h2>
                {result.perQuestionBreakdown.map((item: any) => (
                  <Card key={item.questionId} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{item.questionText}</p>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.responseSummary}</p>
                      </div>
                      <ConfidenceBadge value={item.confidence} />
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Transcript snippet</p>
                        <p className="mt-2 text-sm leading-6 text-foreground/90">{item.transcriptSnippet}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Linked source</p>
                        <p className="mt-2 text-sm text-foreground">{item.relatedSubmissionReference}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">Focus label</p>
                        <p className="mt-1 text-sm text-foreground">{item.linkedFocusPoint}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </section>

              <section id="submission-preview" className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Submission preview</h2>
                <Tabs defaultValue="submission">
                  <TabsList>
                    <TabsTrigger value="submission">Submission</TabsTrigger>
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  </TabsList>
                  <TabsContent value="submission">
                    <SubmissionPreviewPanel
                      title="Linked submission sections"
                      sections={(caseItem.bundleArtifacts?.[0]?.extractedStructure ?? []).map((section: any) => ({
                        title: section.title,
                        body: section.body,
                      }))}
                    />
                  </TabsContent>
                  <TabsContent value="transcript">
                    <Card className="p-5">
                      <div className="flex items-center gap-3">
                        <Search className="size-4 text-muted-foreground" />
                        <Input
                          value={transcriptSearch}
                          onChange={(event) => setTranscriptSearch(event.target.value)}
                          placeholder="Search transcript"
                        />
                      </div>
                      <div className="mt-4 space-y-3">
                        {filteredResponses.map((response: any) => {
                          const question = caseItem.questions.find((item: any) => item.id === response.questionId);
                          return (
                            <TranscriptBlock
                              key={response.id}
                              question={question?.text ?? "Question"}
                              transcript={response.transcriptText}
                              highlight={transcriptSearch}
                            />
                          );
                        })}
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </section>
            </div>

            <div className="space-y-6">
              <ReviewMediaCard
                audioUrl={audioUrl}
                videoUrl={videoUrl}
                note="Audio stays secondary to the synthesized evidence package, but remains available for source checking and transcript-context replay."
              />

              <Card className="p-5">
                <p className="text-lg font-semibold text-foreground">Reviewer notes</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Final judgment remains human-owned. Save the case note once you have enough evidence.
                </p>
                <Textarea
                  className="mt-4"
                  value={note || result.finalReviewerNote || ""}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Write the final reviewer note here."
                />
                <div className="mt-4 flex flex-col gap-2">
                  <Button variant="secondary" loading={saveNoteMutation.isPending} onClick={() => saveNoteMutation.mutate()}>
                    Save reviewer note
                  </Button>
                  <Button loading={markReviewedMutation.isPending} onClick={() => markReviewedMutation.mutate()}>
                    Mark as reviewed
                  </Button>
                  <Button variant="ghost" onClick={exportReport}>
                    Export report
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <p className="text-lg font-semibold text-foreground">Case metadata</p>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Session link</span>
                    <a
                      href={`${env.NEXT_PUBLIC_APP_URL}/session/${caseItem.sessionLinkToken}`}
                      className="inline-flex items-center gap-1 text-primary"
                    >
                      Open
                      <ArrowUpRight className="size-4" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bundle artifacts</span>
                    <span className="text-foreground">{caseItem.bundleArtifacts?.length ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Questions</span>
                    <span className="text-foreground">{caseItem.questions?.length ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Responses</span>
                    <span className="text-foreground">{responses.length}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState title="No result available" description="This case does not have a synthesized review package yet." />
      )}
    </ReviewerShell>
  );
}
