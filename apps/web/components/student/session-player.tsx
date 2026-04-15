"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Mic, PauseCircle, Upload } from "lucide-react";

import { Badge, Button, Panel, Textarea } from "@oralv/ui";

import { apiGet, apiPost } from "@/lib/api";
import { useRecorder } from "@/hooks/use-recorder";

const storageKey = (token: string) => `oralv-session-progress:${token}`;

export function SessionPlayer({ token }: { token: string }) {
  const query = useQuery({
    queryKey: ["public-session", token],
    queryFn: () =>
      apiGet<{
        session: { id: string; status: string; completion_percent: number };
        questions: Array<{
          id: string;
          sequence: number;
          prompt: string;
          prep_seconds: number;
          response_seconds: number;
        }>;
        responses: Array<{ defense_question_id: string; transcript_text?: string | null }>;
      }>(`/sessions/public/${token}`)
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transcriptDraft, setTranscriptDraft] = useState("");
  const [fallbackFile, setFallbackFile] = useState<File | null>(null);
  const recorder = useRecorder();

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey(token));
    if (saved) {
      setCurrentIndex(Number(saved));
    }
  }, [token]);

  useEffect(() => {
    window.localStorage.setItem(storageKey(token), String(currentIndex));
  }, [currentIndex, token]);

  const startMutation = useMutation({
    mutationFn: () => apiPost(`/sessions/public/${token}/start`)
  });
  const submitMutation = useMutation({
    mutationFn: async () => {
      const question = query.data?.questions[currentIndex];
      if (!question) return;
      const formData = new FormData();
      if (recorder.blob) {
        formData.append("file", new File([recorder.blob], `question-${question.sequence}.webm`, { type: "video/webm" }));
      } else if (fallbackFile) {
        formData.append("file", fallbackFile);
      }
      formData.append("transcript_hint", transcriptDraft);
      formData.append("prep_duration_seconds", String(question.prep_seconds));
      formData.append("response_duration_seconds", String(question.response_seconds));
      return apiPost(`/sessions/public/${token}/responses/${question.id}`, formData);
    },
    onSuccess: () => {
      recorder.reset();
      setFallbackFile(null);
      setTranscriptDraft("");
      setCurrentIndex((index) => index + 1);
      query.refetch();
    }
  });
  const completeMutation = useMutation({
    mutationFn: () => apiPost(`/sessions/public/${token}/complete`)
  });

  const currentQuestion = query.data?.questions[currentIndex];
  const completed = (query.data?.responses ?? []).length;
  const allDone = useMemo(
    () => Boolean(query.data?.questions.length && completed >= query.data.questions.length),
    [completed, query.data?.questions]
  );

  return (
    <div className="min-h-screen bg-[var(--canvas)] px-4 py-6 text-[var(--ink)] md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Panel>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Asynchronous oral defense</p>
              <h1 className="mt-3 text-3xl font-semibold">Respond carefully, then confirm your transcript.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                You will answer one question at a time. Recording is supported when your browser permits camera and microphone access. If not, you can upload a response file instead.
              </p>
            </div>
            <div className="flex gap-3">
              <Badge>{completed} answered</Badge>
              {startMutation.isIdle ? (
                <Button onClick={() => startMutation.mutate()}>Begin session</Button>
              ) : (
                <Badge>{query.data?.session.status ?? "active"}</Badge>
              )}
            </div>
          </div>
        </Panel>

        {allDone ? (
          <Panel className="text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
            <h2 className="mt-5 text-2xl font-semibold">All questions answered</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Finalize the session to trigger synthesis and reviewer evidence generation.
            </p>
            <Button className="mt-6" onClick={() => completeMutation.mutate()}>
              {completeMutation.isPending ? "Completing..." : "Complete session"}
            </Button>
          </Panel>
        ) : currentQuestion ? (
          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <Panel>
              <Badge>Question {currentQuestion.sequence}</Badge>
              <h2 className="mt-4 text-2xl font-semibold">{currentQuestion.prompt}</h2>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Prep time</p>
                  <p className="mt-2 text-3xl font-semibold">{currentQuestion.prep_seconds}s</p>
                </div>
                <div className="rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Response time</p>
                  <p className="mt-2 text-3xl font-semibold">{currentQuestion.response_seconds}s</p>
                </div>
              </div>
              <div className="mt-6 rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-4 text-sm leading-7 text-[var(--muted)]">
                Speak to your reasoning, tradeoffs, and evidence. Generic answers will be less helpful to your reviewer.
              </div>
            </Panel>
            <Panel>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Capture</p>
                  <h3 className="mt-2 text-xl font-semibold">Record live or upload a response</h3>
                </div>
                {recorder.supported ? <Badge>{recorder.status}</Badge> : <Badge>Upload fallback</Badge>}
              </div>
              <div className="mt-6 space-y-4">
                {recorder.supported ? (
                  <div className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-4">
                    <div className="flex flex-wrap gap-3">
                      {recorder.status !== "recording" ? (
                        <Button onClick={() => recorder.start()}>
                          <Mic className="h-4 w-4" />
                          Start recording
                        </Button>
                      ) : (
                        <Button onClick={() => recorder.stop()} variant="ghost">
                          <PauseCircle className="h-4 w-4" />
                          Stop recording
                        </Button>
                      )}
                      <Button onClick={() => recorder.reset()} variant="subtle">Reset</Button>
                    </div>
                    {recorder.previewUrl ? (
                      <video className="mt-4 w-full rounded-[18px]" controls src={recorder.previewUrl} />
                    ) : null}
                    {recorder.error ? (
                      <p className="mt-4 flex items-center gap-2 text-sm text-amber-300">
                        <CircleAlert className="h-4 w-4" />
                        {recorder.error}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-dashed border-[var(--line)] bg-[var(--panel)] p-4">
                  <Upload className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-sm">Upload response file instead</span>
                  <input
                    className="hidden"
                    onChange={(event) => setFallbackFile(event.target.files?.[0] ?? null)}
                    type="file"
                  />
                </label>
                <Textarea
                  placeholder="Review and edit the generated transcript before submitting this answer."
                  value={transcriptDraft}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setTranscriptDraft(event.target.value)}
                />
                <Button
                  disabled={submitMutation.isPending || (!recorder.blob && !fallbackFile && !transcriptDraft)}
                  onClick={() => submitMutation.mutate()}
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit answer"}
                </Button>
              </div>
            </Panel>
          </div>
        ) : null}
      </div>
    </div>
  );
}
