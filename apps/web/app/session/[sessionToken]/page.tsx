"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, FileStack, ListChecks, NotebookPen, StopCircle, UploadCloud } from "lucide-react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorAlert,
  PersistentControlBar,
  QuestionCard,
  RecorderControl,
  SessionProgressHeader,
  SubmissionPreviewPanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@concentra/ui";

import { api, uploadFile } from "@/lib/api";

export default function StudentSessionPage() {
  const params = useParams<{ sessionToken: string }>();
  const router = useRouter();
  const sessionToken = params.sessionToken;
  const [questionIndex, setQuestionIndex] = useState(1);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "recorded" | "uploading">("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const hasStartedSessionRef = useRef(false);

  const sessionQuery = useQuery({
    queryKey: ["student-session", sessionToken],
    queryFn: () => api.session(sessionToken),
  });

  useEffect(() => {
    if (!sessionQuery.data?.questions?.length) {
      return;
    }
    const nextMissingQuestionId = sessionQuery.data.completion?.missingQuestionIds?.[0];
    if (!nextMissingQuestionId) {
      setQuestionIndex(sessionQuery.data.questions.length);
      return;
    }
    const nextQuestion = sessionQuery.data.questions.findIndex((question: any) => question.id === nextMissingQuestionId);
    if (nextQuestion >= 0) {
      setQuestionIndex(nextQuestion + 1);
    }
  }, [sessionQuery.data]);

  useEffect(() => {
    const session = sessionQuery.data?.session;
    if (!session || hasStartedSessionRef.current || session.startedAt) return;
    if (!["not_sent", "sent"].includes(session.status)) return;
    hasStartedSessionRef.current = true;
    api.startSession(sessionToken).catch(() => {
      hasStartedSessionRef.current = false;
      return null;
    });
  }, [sessionQuery.data?.session, sessionToken]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [previewUrl]);

  const currentQuestion = sessionQuery.data?.questions?.[questionIndex - 1];
  const sessionCompletion = sessionQuery.data?.completion;
  const responseCount = sessionCompletion?.submittedAnswerCount ?? sessionQuery.data?.responses?.length ?? 0;
  const isVideoMode = sessionQuery.data?.session.mode === "audio_video";
  const canRerecord = sessionQuery.data?.session.allowRerecord ?? true;
  const hasDraftResponse = recordingState === "recorded" && !!recordedBlob;
  const hasPendingCapture = recordingState === "recording" || recordingState === "uploading" || hasDraftResponse;
  const canFinishSession = Boolean(sessionCompletion?.canComplete) && !hasPendingCapture;
  const completionHint = sessionCompletion?.canComplete
    ? "ready to finish"
    : `${sessionCompletion?.missingQuestionIds?.length ?? Math.max((sessionQuery.data?.questions?.length ?? 0) - responseCount, 0)} questions remaining`;
  const submissionSections =
    sessionQuery.data?.bundleArtifacts?.flatMap((artifact: any) =>
      (artifact.extractedStructure ?? []).map((section: any) => ({
        title: `${artifact.fileName} · ${section.title}`,
        body: section.body,
      })),
    ) ?? [];

  const filteredCriteria = useMemo(() => {
    const goals = sessionQuery.data?.assignment?.verificationGoals ?? [];
    if (!currentQuestion) return goals;
    return goals.filter((goal: any) =>
      currentQuestion.focusLabel.toLowerCase().includes(goal.label.toLowerCase().split(" ")[0].toLowerCase()),
    );
  }, [currentQuestion, sessionQuery.data?.assignment?.verificationGoals]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!currentQuestion || !recordedBlob) {
        throw new Error("Record an answer before submitting.");
      }
      setRecordingState("uploading");
      const uploadTarget = await api.sessionUploadUrl(sessionToken, {
        fileName: `${currentQuestion.id}.${isVideoMode ? "video" : "audio"}.webm`,
        mimeType: recordedBlob.type || (isVideoMode ? "video/webm" : "audio/webm"),
        contentLength: recordedBlob.size,
      });
      await uploadFile(
        uploadTarget.uploadUrl,
        recordedBlob,
        recordedBlob.type || (isVideoMode ? "video/webm" : "audio/webm"),
        uploadTarget.headers,
      );
      const durationSeconds = startedAtRef.current ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)) : 60;
      return api.submitResponse(sessionToken, {
        questionId: currentQuestion.id,
        audioPath: uploadTarget.storagePath,
        videoPath: isVideoMode ? uploadTarget.storagePath : null,
        durationSeconds,
      });
    },
    onSuccess: async () => {
      toast.success("Answer submitted");
      setRecordedBlob(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setRecordingState("idle");
      const refreshed = await sessionQuery.refetch();
      if (refreshed.data?.completion?.canComplete) {
        await api.completeSession(sessionToken);
        startTransition(() => {
          router.push(`/session/${sessionToken}/complete`);
        });
      } else {
        const nextMissingQuestionId = refreshed.data?.completion?.missingQuestionIds?.[0];
        const nextIndex = refreshed.data?.questions?.findIndex((question: any) => question.id === nextMissingQuestionId) ?? -1;
        startTransition(() => {
          if (nextIndex >= 0) {
            setQuestionIndex(nextIndex + 1);
            return;
          }
          setQuestionIndex((current) => current + 1);
        });
      }
    },
    onError: (error) => {
      setRecordingState("recorded");
      toast.error(error instanceof Error ? error.message : "Unable to submit answer");
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => api.completeSession(sessionToken),
    onSuccess: () => {
      startTransition(() => {
        router.push(`/session/${sessionToken}/complete`);
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to finish session");
    },
  });

  async function startRecording() {
    try {
      if (recordingState === "recorded" && !canRerecord) {
        return;
      }
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoMode });
      streamRef.current = stream;
      chunksRef.current = [];
      const preferredMimeType = isVideoMode ? "video/webm" : "audio/webm";
      const mimeType = MediaRecorder.isTypeSupported(preferredMimeType) ? preferredMimeType : undefined;
      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      startedAtRef.current = Date.now();
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType ?? preferredMimeType });
        setRecordedBlob(blob);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        setRecordingState("recorded");
      };
      mediaRecorder.start();
      setRecordingState("recording");
    } catch (error) {
      setPermissionError("Microphone access was unavailable. Check browser permissions and retry.");
      toast.error(error instanceof Error ? error.message : "Unable to access microphone");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  return sessionQuery.isLoading ? (
    <div className="min-h-screen bg-background px-6 py-10">
      <Card className="h-24 animate-pulse bg-white/5" />
    </div>
  ) : sessionQuery.error ? (
    <div className="min-h-screen bg-background px-6 py-10">
      <ErrorAlert
        title="Unable to load the oral verification session"
        description={sessionQuery.error instanceof Error ? sessionQuery.error.message : "Refresh the page to try again."}
      />
    </div>
  ) : sessionQuery.data ? (
    <div className="min-h-screen bg-background px-4 py-4 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1580px] space-y-6">
        <SessionProgressHeader
          title={sessionQuery.data.assignment.title}
          questionIndex={questionIndex}
          questionCount={sessionQuery.data.questions.length}
          status={sessionQuery.data.session.status}
        />

        <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
          <div className="space-y-6">
            <Tabs defaultValue="assignment">
              <TabsList>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
                <TabsTrigger value="submission">Your submission</TabsTrigger>
                <TabsTrigger value="criteria">Criteria</TabsTrigger>
              </TabsList>
              <TabsContent value="assignment">
                <Card className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <NotebookPen className="size-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">Assignment context</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{sessionQuery.data.assignment.summary}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(sessionQuery.data.assignment.assignmentUnderstanding?.verificationDimensions ?? []).map((dimension: string) => (
                          <Badge key={dimension} tone="neutral">
                            {dimension}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="submission">
                <SubmissionPreviewPanel title="Your submission" sections={submissionSections} />
              </TabsContent>
              <TabsContent value="criteria">
                <Card className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white/5 text-primary">
                      <ListChecks className="size-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">Relevant criteria</p>
                      <p className="text-sm text-muted-foreground">
                        Focused on the criteria most related to the current question.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {filteredCriteria.length ? (
                      filteredCriteria.map((goal: any) => (
                        <div key={goal.id} className="rounded-2xl border border-border/70 bg-white/5 p-4">
                          <p className="font-medium text-foreground">{goal.label}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{goal.description}</p>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="Criteria will appear here" description="Question-linked criteria are shown alongside the current oral prompt." />
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            {currentQuestion ? (
              <QuestionCard
                index={questionIndex}
                focusLabel={currentQuestion.focusLabel}
                question={currentQuestion.text}
                rationale={
                  <div className="rounded-2xl bg-white/5 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">What to explain</p>
                    <p className="mt-2 leading-6">{currentQuestion.expectedEvidence}</p>
                  </div>
                }
                footer={
                  <div className="rounded-2xl border border-border/70 bg-white/5 p-4 text-sm text-muted-foreground">
                    Answer naturally. Focus on how you made the decision or built the explanation in your submission.
                  </div>
                }
              />
            ) : null}

            {permissionError ? (
              <Card className="border-danger/40 bg-danger/10 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-1 size-4 text-danger-foreground" />
                  <p className="text-sm text-muted-foreground">{permissionError}</p>
                </div>
              </Card>
            ) : null}

            <RecorderControl
              status={
                recordingState === "recording"
                  ? "Recording in progress"
                  : recordingState === "recorded"
                    ? "Answer ready to review"
                    : recordingState === "uploading"
                      ? "Uploading answer"
                      : "Ready to record"
              }
              primaryLabel={recordingState === "recording" ? "Stop recording" : "Start recording"}
              canRecord={
                recordingState !== "uploading" &&
                !completeMutation.isPending &&
                (recordingState !== "recorded" || canRerecord)
              }
              onPrimary={recordingState === "recording" ? stopRecording : startRecording}
            />

            {previewUrl ? (
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <FileStack className="size-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Review your answer</p>
                    <p className="text-sm text-muted-foreground">
                      Replay before submitting. {canRerecord ? "If rerecord is enabled, you can replace it." : "This assignment disables rerecord, so this capture will be submitted as-is."}
                    </p>
                  </div>
                </div>
                {isVideoMode ? (
                  <video controls className="mt-4 w-full rounded-2xl border border-border/70 bg-black/50">
                    <source src={previewUrl} />
                  </video>
                ) : (
                  <audio controls className="mt-4 w-full">
                    <source src={previewUrl} />
                  </audio>
                )}
              </Card>
            ) : null}
          </div>
        </div>

        <PersistentControlBar
          status={`${responseCount} of ${sessionCompletion?.requiredAnswerCount ?? sessionQuery.data.questions.length} required responses submitted · ${completionHint} · ${recordingState} · ${isVideoMode ? "audio + video mode" : "audio-only mode"}`}
        >
          <Button
            variant="secondary"
            disabled={!recordedBlob || recordingState === "uploading" || !canRerecord || completeMutation.isPending}
            onClick={() => {
              setRecordedBlob(null);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
              setRecordingState("idle");
            }}
          >
            Re-record
          </Button>
          <Button
            disabled={!recordedBlob || recordingState === "uploading" || completeMutation.isPending}
            loading={submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            <UploadCloud className="size-4" />
            Submit answer
          </Button>
          <Button
            variant="ghost"
            disabled={questionIndex >= sessionQuery.data.questions.length || hasPendingCapture || completeMutation.isPending}
            onClick={() => startTransition(() => setQuestionIndex((current) => Math.min(current + 1, sessionQuery.data.questions.length)))}
          >
            Next question
          </Button>
          <Button
            variant="ghost"
            disabled={questionIndex <= 1 || hasPendingCapture || completeMutation.isPending}
            onClick={() => startTransition(() => setQuestionIndex((current) => Math.max(current - 1, 1)))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={!canFinishSession || completeMutation.isPending}
            loading={completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
          >
            <StopCircle className="size-4" />
            Finish session
          </Button>
        </PersistentControlBar>
      </div>
    </div>
  ) : null;
}
