import { BookOpen, FileText, List, Mic, Square, X } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import IconButton from "../components/IconButton";
import Kbd from "../components/Kbd";
import { getCaseById, showcaseCaseId, studentSessionQuestions } from "../data/mock";
import { cn } from "../lib/cn";

const showcaseCase = getCaseById(showcaseCaseId);

type DrawerMode = "assignment" | "rubric" | "submission" | null;

export default function StudentSession() {
  const navigate = useNavigate();
  const { token = "" } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "reviewing">("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [reviewedSec, setReviewedSec] = useState(0);

  const currentQuestion = studentSessionQuestions[currentIndex];

  useEffect(() => {
    if (recordingState !== "recording") {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSec((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [recordingState]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (recordingState === "idle") {
          setRecordingState("recording");
          setElapsedSec(0);
        } else if (recordingState === "recording") {
          setRecordingState("reviewing");
          setReviewedSec(elapsedSec);
        }
      }

      if (event.key.toLowerCase() === "r" && recordingState === "reviewing") {
        setRecordingState("idle");
        setElapsedSec(0);
        setReviewedSec(0);
      }

      if (event.key === "Enter" && recordingState === "reviewing") {
        if (currentIndex === studentSessionQuestions.length - 1) {
          navigate(`/s/${token}/complete`);
          return;
        }
        startTransition(() => {
          setCurrentIndex((current) => current + 1);
          setRecordingState("idle");
          setElapsedSec(0);
          setReviewedSec(0);
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentIndex, elapsedSec, navigate, recordingState, token]);

  const progress = ((currentIndex + 1) / studentSessionQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex h-14 items-center justify-between border-b border-line bg-paper px-8">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-sm2 bg-forest" />
          <span className="font-serif text-18 text-ink">Congentra</span>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-13 text-mute">
            Question {currentIndex + 1} of {studentSessionQuestions.length}
          </p>
          <div className="h-1 w-48 rounded-full bg-line">
            <div className="h-full rounded-full bg-forest" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <Button onClick={() => navigate("/login")} size="sm" variant="ghost">
          Save &amp; exit
        </Button>
      </header>

      <div className="fixed left-1.5 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-16 lg:flex">
        {[
          { mode: "assignment" as const, icon: FileText, label: "Assignment" },
          { mode: "rubric" as const, icon: List, label: "Rubric" },
          { mode: "submission" as const, icon: BookOpen, label: "My submission" },
        ].map((item) => (
          <button
            aria-label={item.label}
            className="inline-flex h-10 w-10 items-center justify-center rounded-r-md2 border border-l-0 border-line bg-surface text-ink shadow-e1 transition-colors duration-150 ease-out hover:bg-hover"
            key={item.mode}
            onClick={() => setDrawer(item.mode)}
            type="button"
          >
            <item.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {drawer ? (
        <div className="fixed inset-0 z-30 flex bg-ink/20">
          <div className="w-[420px] border-r border-line bg-surface px-7 py-7 shadow-e3 transition-transform duration-220 ease-out">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="display text-28 text-ink">
                {drawer === "assignment" ? "Assignment" : drawer === "rubric" ? "Rubric" : "My submission"}
              </h2>
              <IconButton aria-label="Close drawer" onClick={() => setDrawer(null)}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            {drawer === "assignment" ? (
              <div className="space-y-4 text-14 text-ink">
                <p>The essay should defend a thesis about justice rather than summarize two positions side by side.</p>
                <p>Use a specific example to distinguish procedural justice from a purely outcome-based view.</p>
                <p>Conclude by naming at least one limit or unresolved objection.</p>
              </div>
            ) : null}
            {drawer === "rubric" ? (
              <ul className="space-y-3 text-14 text-ink">
                <li>Original articulation of the thesis</li>
                <li>Accurate use of course concepts</li>
                <li>Clear reasoning for chosen evidence</li>
                <li>Recognition of limits and objections</li>
              </ul>
            ) : null}
            {drawer === "submission" ? (
              <div className="space-y-4 text-14 text-ink">
                <p>{showcaseCase?.submissionDocs?.[0]?.sections[0]?.paragraphs[0]}</p>
                <p>{showcaseCase?.submissionDocs?.[0]?.sections[1]?.paragraphs[1]}</p>
              </div>
            ) : null}
          </div>
          <button className="flex-1" onClick={() => setDrawer(null)} type="button" />
        </div>
      ) : null}

      <main className="mx-auto max-w-[880px] px-6 py-14 text-center">
        <p className="text-12 uppercase tracking-widest text-mute">
          Question {currentIndex + 1} of {studentSessionQuestions.length} · About 90 seconds
        </p>
        <h1 className="display mx-auto mt-4 max-w-[720px] text-36 leading-[44px] text-ink">
          {currentQuestion.prompt}
        </h1>
        <p className="mt-3 text-14 text-mute">
          Speak naturally. You can pause to think. You can re-record before continuing.
        </p>

        <div className="mt-12 flex flex-col items-center">
          <button
            className={cn(
              "relative inline-flex h-24 w-24 items-center justify-center rounded-full text-white transition-colors duration-150 ease-out",
              recordingState === "recording" ? "bg-danger" : "bg-ink",
            )}
            onClick={() => {
              if (recordingState === "idle") {
                setRecordingState("recording");
                setElapsedSec(0);
                return;
              }
              if (recordingState === "recording") {
                setRecordingState("reviewing");
                setReviewedSec(elapsedSec);
              }
            }}
            type="button"
          >
            {recordingState === "recording" ? <span className="absolute inset-0 rounded-full bg-danger opacity-30 animate-ping" /> : null}
            {recordingState === "recording" ? <Square className="relative h-6 w-6 fill-current" /> : <Mic className="relative h-6 w-6" />}
          </button>
          <p className="mt-4 text-13 text-mute">
            {recordingState === "idle"
              ? "Tap to start"
              : recordingState === "recording"
                ? `Recording · 00:${String(elapsedSec).padStart(2, "0")}`
                : `Reviewing · 00:${String(reviewedSec).padStart(2, "0")}`}
          </p>

          {recordingState === "recording" ? (
            <svg className="mt-6 h-12 w-[320px]" viewBox="0 0 320 48">
              {Array.from({ length: 24 }, (_, index) => {
                const height = 10 + ((index * 11) % 28);
                return (
                  <rect
                    key={index}
                    className="animate-pulse"
                    fill="#2F5D4E"
                    height={height}
                    rx="3"
                    width="8"
                    x={index * 13}
                    y={(48 - height) / 2}
                  />
                );
              })}
            </svg>
          ) : null}

          {recordingState === "reviewing" ? (
            <div className="mt-8 flex items-center gap-3">
              <Button
                onClick={() => {
                  setRecordingState("idle");
                  setElapsedSec(0);
                  setReviewedSec(0);
                }}
                variant="secondary"
              >
                Re-record
              </Button>
              <Button
                onClick={() => {
                  if (currentIndex === studentSessionQuestions.length - 1) {
                    navigate(`/s/${token}/complete`);
                    return;
                  }
                  startTransition(() => {
                    setCurrentIndex((current) => current + 1);
                    setRecordingState("idle");
                    setElapsedSec(0);
                    setReviewedSec(0);
                  });
                }}
              >
                Save and continue
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-12 flex items-center justify-center gap-3 text-12 text-mute">
          <span>Keyboard shortcuts</span>
          <Kbd>Space</Kbd>
          <span>record</span>
          <Kbd>R</Kbd>
          <span>re-record</span>
          <Kbd>↵</Kbd>
          <span>continue</span>
        </div>
      </main>

      <aside className="fixed right-0 top-14 hidden h-[calc(100vh-56px)] w-[260px] border-l border-line bg-paper px-6 pt-16 lg:block">
        <p className="text-12 uppercase tracking-widest text-mute">Questions</p>
        <div className="mt-4 space-y-2">
          {studentSessionQuestions.map((question, index) => {
            const state =
              index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";

            return (
              <button
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-md2 px-3 text-left transition-colors duration-150 ease-out",
                  state === "current" && "bg-hover",
                )}
                key={question.id}
                onClick={() => setCurrentIndex(index)}
                type="button"
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                    state === "done"
                      ? "bg-forest text-white"
                      : state === "current"
                        ? "border border-ink text-ink"
                        : "border border-line text-mute",
                  )}
                >
                  {state === "done" ? "✓" : index + 1}
                </span>
                <span className="line-clamp-1 text-13 text-ink">{question.preview}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="border-t border-line py-1 text-center text-12 text-mute">
        Your audio is recorded only for this question and uploaded securely.
      </div>
    </div>
  );
}
