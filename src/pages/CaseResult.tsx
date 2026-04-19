import {
  ChevronLeft,
  Download,
  FileText,
  Search,
  Share2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Card from "../components/Card";
import ConfidenceBar from "../components/ConfidenceBar";
import ConfidenceDot from "../components/ConfidenceDot";
import Divider from "../components/Divider";
import EvidenceCard from "../components/EvidenceCard";
import FocusPointRow from "../components/FocusPointRow";
import IconButton from "../components/IconButton";
import MediaPlayer from "../components/MediaPlayer";
import SubmissionDoc from "../components/SubmissionDoc";
import TranscriptTurn from "../components/TranscriptTurn";
import {
  formatDuration,
  formatTimestamp,
  getAssignmentById,
  getCaseById,
  type EvidenceItem,
} from "../data/mock";
import { cn } from "../lib/cn";

type LeftMode = "focus" | "transcript" | "source";

export default function CaseResult() {
  const navigate = useNavigate();
  const { id = "", caseId = "" } = useParams();
  const assignment = getAssignmentById(id);
  const caseRecord = getCaseById(caseId);

  if (
    !assignment ||
    !caseRecord ||
    !caseRecord.focusPoints ||
    !caseRecord.evidence ||
    !caseRecord.transcript ||
    !caseRecord.submissionDocs ||
    !caseRecord.sessionDurationSec
  ) {
    return (
      <div className="px-8 py-16">
        <p className="text-15 text-mute">Case result not found.</p>
      </div>
    );
  }

  const [leftMode, setLeftMode] = useState<LeftMode>("focus");
  const [selectedFocusId, setSelectedFocusId] = useState(caseRecord.focusPoints[0]?.id ?? "");
  const [selectedTurnId, setSelectedTurnId] = useState(caseRecord.transcript[0]?.id ?? "");
  const [selectedDocId, setSelectedDocId] = useState(caseRecord.submissionDocs[0]?.id ?? "");
  const [selectedSectionId, setSelectedSectionId] = useState(
    caseRecord.submissionDocs[0]?.sections[0]?.id ?? "",
  );
  const [hoveredEvidenceId, setHoveredEvidenceId] = useState<string | null>(null);
  const [pinnedEvidenceId, setPinnedEvidenceId] = useState<string | null>(null);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reviewed, setReviewed] = useState(caseRecord.reviewed ?? false);

  const selectedFocus =
    caseRecord.focusPoints.find((focusPoint) => focusPoint.id === selectedFocusId) ??
    caseRecord.focusPoints[0];
  const selectedDoc =
    caseRecord.submissionDocs.find((doc) => doc.id === selectedDocId) ??
    caseRecord.submissionDocs[0];

  const visibleEvidence =
    leftMode === "focus"
      ? caseRecord.evidence.filter((item) => selectedFocus.evidenceIds.includes(item.id))
      : caseRecord.evidence;

  const activePreviewEvidence =
    caseRecord.evidence.find((item) => item.id === hoveredEvidenceId) ??
    caseRecord.evidence.find((item) => item.id === pinnedEvidenceId) ??
    null;

  const sectionEvidence = caseRecord.evidence.filter(
    (item) => item.sourceDocId === selectedDoc.id && item.sourceSectionId === selectedSectionId,
  );

  useEffect(() => {
    if (leftMode === "focus") {
      setPinnedEvidenceId(null);
    }
  }, [leftMode, selectedFocus]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentTimeSec((current) => {
        if (current >= caseRecord.sessionDurationSec) {
          window.clearInterval(timer);
          setIsPlaying(false);
          return caseRecord.sessionDurationSec;
        }
        return current + 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [caseRecord.sessionDurationSec, isPlaying]);

  const openTranscriptFromEvidence = (evidence: EvidenceItem) => {
    const turn = caseRecord.transcript?.find((item) => item.id === evidence.transcriptTurnId);
    setPinnedEvidenceId(evidence.id);
    setSelectedTurnId(evidence.transcriptTurnId);
    setCurrentTimeSec(turn?.startSec ?? 0);
    setIsPlayerOpen(true);
    setLeftMode("transcript");
  };

  const openSourceFromEvidence = (evidence: EvidenceItem) => {
    setPinnedEvidenceId(evidence.id);
    setSelectedDocId(evidence.sourceDocId);
    setSelectedSectionId(evidence.sourceSectionId);
    setLeftMode("source");
  };

  return (
    <div className="pb-28">
      <div className="sticky top-14 z-10 border-b border-line bg-paper">
        <div className="flex h-16 items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <IconButton aria-label="Back" onClick={() => navigate(`/assignments/${id}/cases`)}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <Avatar name={caseRecord.studentName} size={32} />
            <div>
              <p className="text-15 font-medium text-ink">
                {caseRecord.studentName} <span className="mono text-12 text-mute">· {caseRecord.studentId}</span>
              </p>
              <p className="text-12 text-mute">{assignment.name}</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 xl:flex">
            <div className="rounded-md2 border border-line bg-surface px-3 py-2">
              <div className="flex items-center gap-2 text-13 text-ink">
                <ConfidenceDot level={caseRecord.confidence ?? "medium"} />
                <span className="capitalize">{caseRecord.confidence ?? "Medium"}</span>
              </div>
              <ConfidenceBar className="mt-2 w-16" level={caseRecord.confidence ?? "medium"} value={86} />
            </div>
            <div className="rounded-md2 border border-line bg-surface px-3 py-2 text-13 text-ink">
              {caseRecord.focusPoints.length} points · {caseRecord.focusPoints.filter((item) => item.needsAttention).length} need attention
            </div>
            <div className="rounded-md2 border border-line bg-surface px-3 py-2 text-13 text-ink">
              {formatDuration(caseRecord.sessionDurationSec)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reviewed ? <Badge variant="active">Reviewed</Badge> : null}
            <Button onClick={() => setIsPlayerOpen((current) => !current)} size="md" variant="secondary">
              Session media
            </Button>
            <IconButton aria-label="Share case">
              <Share2 className="h-4 w-4" />
            </IconButton>
            <Button onClick={() => setReviewed((current) => !current)} size="md">
              {reviewed ? "Reviewed" : "Mark reviewed"}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid min-h-[calc(100vh-120px)]",
          leftMode === "focus"
            ? "xl:grid-cols-[280px_minmax(0,1fr)_380px]"
            : "grid-cols-[280px_minmax(0,1fr)]",
        )}
      >
        <aside className="sticky top-[112px] h-[calc(100vh-112px)] overflow-y-auto border-r border-line bg-paper">
          <div className="border-b border-line p-4">
            <div className="flex rounded-md2 bg-hover p-1">
              {(["focus", "transcript", "source"] as LeftMode[]).map((mode) => (
                <button
                  className={cn(
                    "flex-1 rounded-sm2 px-3 py-2 text-13 transition-all duration-150 ease-out",
                    leftMode === mode ? "bg-surface text-ink shadow-e1" : "text-mute",
                  )}
                  key={mode}
                  onClick={() => setLeftMode(mode)}
                  type="button"
                >
                  {mode === "focus" ? "Focus" : mode === "transcript" ? "Transcript" : "Source"}
                </button>
              ))}
            </div>
          </div>

          {leftMode === "focus" ? (
            <div>
              {caseRecord.focusPoints.map((focusPoint) => (
                <FocusPointRow
                  active={focusPoint.id === selectedFocus.id}
                  focusPoint={focusPoint}
                  key={focusPoint.id}
                  onClick={() => {
                    setSelectedFocusId(focusPoint.id);
                    setPinnedEvidenceId(null);
                    setHoveredEvidenceId(null);
                  }}
                />
              ))}
            </div>
          ) : null}

          {leftMode === "transcript" ? (
            <div>
              {caseRecord.transcript.map((turn) => (
                <button
                  className={cn(
                    "w-full border-b border-line px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-hover",
                    selectedTurn.id === turn.id && "bg-hover",
                  )}
                  key={turn.id}
                  onClick={() => {
                    setSelectedTurnId(turn.id);
                    setCurrentTimeSec(turn.startSec);
                    setIsPlayerOpen(true);
                  }}
                  type="button"
                >
                  <p className="mono text-12 text-mute">
                    Q{turn.questionNumber} · {formatTimestamp(turn.startSec)}
                  </p>
                  <p className="truncate text-13 text-ink">{turn.question}</p>
                </button>
              ))}
            </div>
          ) : null}

          {leftMode === "source" ? (
            <div>
              {caseRecord.submissionDocs.map((doc) => (
                <div key={doc.id}>
                  {doc.sections.map((section) => (
                    <button
                      className={cn(
                        "w-full border-b border-line px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-hover",
                        selectedSectionId === section.id && "bg-hover",
                      )}
                      key={section.id}
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setSelectedSectionId(section.id);
                      }}
                      type="button"
                    >
                      <p className="text-12 text-mute">{doc.name}</p>
                      <p className="truncate text-13 text-ink">{section.title}</p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </aside>

        <section className="min-w-0">
          {leftMode === "focus" ? (
            <div className="mx-auto max-w-[860px] space-y-8 px-8 py-8">
              <div className="space-y-3">
                <p className="text-12 uppercase tracking-widest text-mute">
                  Focus point {caseRecord.focusPoints.findIndex((item) => item.id === selectedFocus.id) + 1} of {caseRecord.focusPoints.length}
                </p>
                <h2 className="display text-28 text-ink">{selectedFocus.title}</h2>
                <div className="flex flex-wrap items-center gap-3 text-13">
                  <span className="flex items-center gap-2 text-ink">
                    <ConfidenceDot level={selectedFocus.level} />
                    <span className="capitalize">{selectedFocus.level} confidence</span>
                  </span>
                  <Divider className="h-4" orientation="vertical" />
                  <span className="text-mute">
                    {selectedFocus.evidenceIds.length} pieces of evidence · based on Q{selectedFocus.questionNumbers.join(", Q")}
                  </span>
                </div>
              </div>

              <Card>
                <p className="text-15 leading-[26px] text-ink">{selectedFocus.summary}</p>
              </Card>

              <div className="space-y-4">
                {visibleEvidence.map((evidence) => {
                  const transcriptTurn =
                    caseRecord.transcript?.find((turn) => turn.id === evidence.transcriptTurnId) ??
                    caseRecord.transcript![0];

                  return (
                    <EvidenceCard
                      active={activePreviewEvidence?.id === evidence.id}
                      evidence={evidence}
                      key={evidence.id}
                      onHover={(item) => setHoveredEvidenceId(item?.id ?? null)}
                      onJumpToTranscript={() => openTranscriptFromEvidence(evidence)}
                      onOpenSource={() => openSourceFromEvidence(evidence)}
                      transcriptTurn={transcriptTurn}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {leftMode === "transcript" ? (
            <div className="mx-auto max-w-[860px] px-8 py-8">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-13 text-mute">
                  {formatDuration(caseRecord.sessionDurationSec)} · {caseRecord.questionCount} questions · auto transcribed
                </p>
                <div className="flex items-center gap-2">
                  <IconButton aria-label="Search transcript">
                    <Search className="h-4 w-4" />
                  </IconButton>
                  <IconButton aria-label="Download transcript">
                    <Download className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
              <Card className="overflow-hidden" unstyled>
                {caseRecord.transcript.map((turn) => (
                  <TranscriptTurn
                    key={turn.id}
                    linkedEvidence={caseRecord.evidence.filter((evidence) => evidence.transcriptTurnId === turn.id)}
                    onEvidenceHover={(item) => setHoveredEvidenceId(item?.id ?? null)}
                    onTimestampClick={(seconds) => {
                      setCurrentTimeSec(seconds);
                      setIsPlayerOpen(true);
                      setIsPlaying(false);
                    }}
                    studentName={caseRecord.studentName}
                    turn={turn}
                  />
                ))}
              </Card>
            </div>
          ) : null}

          {leftMode === "source" ? (
            <div className="px-8 py-8">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {caseRecord.submissionDocs.map((doc) => (
                  <button
                    className={cn(
                      "rounded-md2 border px-3 py-2 text-13 transition-colors duration-150 ease-out",
                      selectedDoc.id === doc.id
                        ? "border-line2 bg-surface text-ink shadow-e1"
                        : "border-line bg-hover text-mute",
                    )}
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setSelectedSectionId(doc.sections[0]?.id ?? "");
                    }}
                    type="button"
                  >
                    {doc.name}
                  </button>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px]">
                <SubmissionDoc
                  activeEvidenceId={activePreviewEvidence?.id ?? sectionEvidence[0]?.id ?? null}
                  doc={selectedDoc}
                  onHighlightClick={(evidenceId) => {
                    const evidence = caseRecord.evidence?.find((item) => item.id === evidenceId);
                    if (evidence) {
                      setPinnedEvidenceId(evidence.id);
                      setCurrentTimeSec(
                        caseRecord.transcript?.find((turn) => turn.id === evidence.transcriptTurnId)?.startSec ?? 0,
                      );
                      setIsPlayerOpen(true);
                    }
                  }}
                />
                <div className="space-y-3">
                  <p className="text-12 uppercase tracking-widest text-mute">Evidence pins</p>
                  {sectionEvidence.length ? (
                    sectionEvidence.map((evidence) => (
                      <button
                        className="w-full rounded-xl2 border border-line bg-surface px-4 py-3 text-left shadow-e1 transition-colors duration-150 ease-out hover:bg-hover"
                        key={evidence.id}
                        onClick={() => {
                          setPinnedEvidenceId(evidence.id);
                          setCurrentTimeSec(
                            caseRecord.transcript?.find((turn) => turn.id === evidence.transcriptTurnId)?.startSec ?? 0,
                          );
                          setIsPlayerOpen(true);
                        }}
                        type="button"
                      >
                        <p className="text-13 font-medium text-ink">{evidence.sourceRefLabel.replace("SOURCE · ", "")}</p>
                        <p className="text-12 text-mute">{evidence.sourceCaption}</p>
                      </button>
                    ))
                  ) : (
                    <p className="text-13 text-mute">No evidence is linked to this section.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {leftMode === "focus" ? (
          <aside className="sticky top-[112px] hidden h-[calc(100vh-112px)] overflow-y-auto border-l border-line bg-surface xl:block">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="text-13 font-medium uppercase tracking-widest text-ink">Source view</p>
              <IconButton
                aria-label="Clear source preview"
                onClick={() => {
                  setHoveredEvidenceId(null);
                  setPinnedEvidenceId(null);
                }}
              >
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            <div className="p-5">
              {activePreviewEvidence ? (
                <div className="space-y-4">
                  <p className="mono text-11 text-mute">{activePreviewEvidence.sourceRefLabel}</p>
                  <blockquote className="rounded-xl2 border border-line bg-paper px-4 py-4 text-14 leading-6 text-ink">
                    {activePreviewEvidence.sourceExcerpt}
                  </blockquote>
                  <button
                    className="inline-flex items-center gap-2 rounded-md2 border border-line bg-hover px-3 py-2 text-13 text-ink transition-colors duration-150 ease-out hover:bg-surface"
                    onClick={() => openSourceFromEvidence(activePreviewEvidence)}
                    type="button"
                  >
                    <FileText className="h-4 w-4" />
                    Show source
                  </button>
                </div>
              ) : (
                <div className="flex min-h-[320px] items-center justify-center">
                  <p className="max-w-[220px] text-center text-13 text-mute">
                    Hover any evidence card to preview its source passage.
                  </p>
                </div>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      <MediaPlayer
        currentTimeSec={currentTimeSec}
        durationSec={caseRecord.sessionDurationSec}
        isOpen={isPlayerOpen}
        isPlaying={isPlaying}
        onClose={() => {
          setIsPlayerOpen(false);
          setIsPlaying(false);
        }}
        onToggleOpen={() => setIsPlayerOpen((current) => !current)}
        onTogglePlay={() => {
          setIsPlayerOpen(true);
          setIsPlaying((current) => !current);
        }}
      />
    </div>
  );
}
