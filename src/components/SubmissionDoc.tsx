import type { SubmissionDoc as SubmissionDocType } from "../data/mock";

function renderHighlightedText(
  text: string,
  highlights?: { text: string; evidenceIds: string[]; transcriptRef: string }[],
) {
  if (!highlights?.length) {
    return text;
  }

  const match = highlights.find((highlight) => text.includes(highlight.text));
  if (!match) {
    return text;
  }

  const [before, ...rest] = text.split(match.text);
  const after = rest.join(match.text);

  return (
    <>
      {before}
      <mark className="rounded-sm bg-highlight px-0.5 text-highlightInk">{match.text}</mark>
      {after}
    </>
  );
}

type SubmissionDocProps = {
  activeEvidenceId?: string | null;
  doc: SubmissionDocType;
  onHighlightClick?: (evidenceId: string) => void;
};

export default function SubmissionDoc({ activeEvidenceId, doc, onHighlightClick }: SubmissionDocProps) {
  return (
    <div className="rounded-xl2 border border-line bg-surface shadow-e1">
      <div className="border-b border-line px-5 py-3">
        <p className="text-13 font-medium text-ink">{doc.name}</p>
      </div>
      <div className="mx-auto max-w-[720px] space-y-8 px-6 py-8">
        {doc.sections.map((section) => (
          <section className="space-y-4" id={section.id} key={section.id}>
            <div className="space-y-1">
              <p className="mono text-11 text-mute">{section.pageLabel}</p>
              <h3 className="display text-22 text-ink">{section.title}</h3>
            </div>
            <div className="space-y-4 text-15 leading-7 text-ink">
              {section.paragraphs.map((paragraph) => {
                const matchingHighlights = section.highlights?.filter((highlight) => paragraph.includes(highlight.text));
                const activeHighlight = matchingHighlights?.find(
                  (highlight) => activeEvidenceId && highlight.evidenceIds.includes(activeEvidenceId),
                );

                return (
                  <div className="space-y-2" key={paragraph}>
                    <p className="font-serif">{renderHighlightedText(paragraph, matchingHighlights)}</p>
                    {activeHighlight ? (
                      <button
                        className="inline-flex items-center rounded-md2 border border-line bg-hover px-2 py-1 text-12 text-mute transition-colors duration-150 ease-out hover:bg-surface hover:text-ink"
                        onClick={() => onHighlightClick?.(activeHighlight.evidenceIds[0])}
                        type="button"
                      >
                        Referenced in {activeHighlight.transcriptRef}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
