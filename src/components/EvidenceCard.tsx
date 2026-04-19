import { ArrowUpRight, FileText } from "lucide-react";
import type { EvidenceItem, TranscriptTurn } from "../data/mock";
import { cn } from "../lib/cn";
import ConfidenceDot from "./ConfidenceDot";

function renderHighlightedText(text: string, highlight: string) {
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

type EvidenceCardProps = {
  evidence: EvidenceItem;
  transcriptTurn: TranscriptTurn;
  active?: boolean;
  onHover?: (evidence: EvidenceItem | null) => void;
  onJumpToTranscript?: () => void;
  onOpenSource?: () => void;
};

const strengthMap = {
  strong: { label: "Strong", level: "high" as const },
  partial: { label: "Partial", level: "medium" as const },
  weak: { label: "Weak", level: "low" as const },
};

export default function EvidenceCard({
  active = false,
  evidence,
  onHover,
  onJumpToTranscript,
  onOpenSource,
  transcriptTurn,
}: EvidenceCardProps) {
  const strength = strengthMap[evidence.strength];

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl2 border border-line bg-surface shadow-e1 transition-colors duration-150 ease-out",
        active && "border-line2",
      )}
      onMouseEnter={() => onHover?.(evidence)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex items-center justify-between border-b border-line bg-hover px-5 py-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-11 uppercase tracking-widest text-mute">Evidence</p>
            <p className="mono text-12 text-mute">{String(evidence.index).padStart(2, "0")}</p>
          </div>
          <div className="flex items-center gap-1.5 text-12 text-ink2">
            <ConfidenceDot level={strength.level} />
            <span>{strength.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-12 text-linkBlue">
          <button
            className="inline-flex items-center gap-1 transition-colors duration-150 ease-out hover:text-ink"
            onClick={onJumpToTranscript}
            type="button"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Jump to transcript
          </button>
          <button
            className="inline-flex items-center gap-1 transition-colors duration-150 ease-out hover:text-ink"
            onClick={onOpenSource}
            type="button"
          >
            <FileText className="h-3.5 w-3.5" />
            Open source
          </button>
        </div>
      </div>
      <div className="relative grid gap-0 md:grid-cols-2">
        <div className="space-y-3 p-5">
          <p className="mono text-11 text-mute">{evidence.transcriptRefLabel}</p>
          <p className="text-13 italic text-mute">{transcriptTurn.question}</p>
          <p className="text-14 text-ink">{renderHighlightedText(transcriptTurn.answer, evidence.answerHighlight)}</p>
        </div>
        <div className="border-l border-line p-5">
          <p className="mono text-11 text-mute">{evidence.sourceRefLabel}</p>
          <blockquote className="mt-3 border-l border-line2 pl-4 text-14 text-ink">
            {renderHighlightedText(evidence.sourceExcerpt, evidence.sourceHighlight)}
          </blockquote>
          <p className="mt-3 text-12 text-mute">{evidence.sourceCaption}</p>
        </div>
        <div className="absolute left-1/2 top-1/2 hidden h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-12 text-mute md:flex">
          ↔
        </div>
      </div>
    </article>
  );
}
