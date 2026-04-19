import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { EvidenceItem, TranscriptTurn as TranscriptTurnType } from "../data/mock";
import { formatTimestamp } from "../data/mock";
import Avatar from "./Avatar";
import Badge from "./Badge";
import Card from "./Card";

function renderHighlightedText(text: string, highlight?: string) {
  if (!highlight || !text.includes(highlight)) {
    return text;
  }

  const [before, ...rest] = text.split(highlight);
  const after = rest.join(highlight);

  return (
    <>
      {before}
      <mark className="rounded-sm bg-highlight px-0.5 text-highlightInk">{highlight}</mark>
      {after}
    </>
  );
}

type TranscriptTurnProps = {
  studentName: string;
  turn: TranscriptTurnType;
  linkedEvidence: EvidenceItem[];
  onTimestampClick?: (seconds: number) => void;
  onEvidenceHover?: (evidence: EvidenceItem | null) => void;
};

export default function TranscriptTurn({
  linkedEvidence,
  onEvidenceHover,
  onTimestampClick,
  studentName,
  turn,
}: TranscriptTurnProps) {
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <div className="border-b border-line px-5 py-4 transition-colors duration-150 ease-out hover:bg-hover">
      <div className="flex gap-4">
        <div className="flex w-16 flex-col items-center gap-2">
          <Avatar name={studentName} size={24} />
          <button
            className="mono text-12 text-mute transition-colors duration-150 ease-out hover:text-ink"
            onClick={() => onTimestampClick?.(turn.startSec)}
            type="button"
          >
            {formatTimestamp(turn.startSec)}
          </button>
        </div>
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <p className="text-12 uppercase tracking-widest text-mute">Interviewer</p>
            <p className="text-14 text-ink">{turn.question}</p>
          </div>
          <div className="space-y-2">
            <p className="text-12 uppercase tracking-widest text-mute">{studentName}</p>
            <p className="text-14 text-ink">
              {renderHighlightedText(turn.answer, turn.highlight)}
              {linkedEvidence.length ? (
                <button
                  className="ml-2 inline-flex items-center gap-1 rounded-sm2 border border-line bg-hover px-2 py-0.5 text-11 text-mute transition-colors duration-150 ease-out hover:bg-surface hover:text-ink"
                  onClick={() => setShowEvidence((current) => !current)}
                  type="button"
                >
                  {linkedEvidence.length} evidence linked
                  <ChevronDown className="h-3 w-3" />
                </button>
              ) : null}
            </p>
            {showEvidence ? (
              <div className="space-y-2 pt-1">
                {linkedEvidence.map((evidence) => (
                  <div
                    key={evidence.id}
                    onMouseEnter={() => onEvidenceHover?.(evidence)}
                    onMouseLeave={() => onEvidenceHover?.(null)}
                  >
                    <Card className="shadow-none" unstyled>
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-13 font-medium text-ink">{evidence.sourceRefLabel.replace("SOURCE · ", "")}</p>
                          <p className="text-12 text-mute">{evidence.sourceCaption}</p>
                        </div>
                        <Badge variant="ready">Evidence</Badge>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
