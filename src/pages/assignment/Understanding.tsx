import { useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { getUnderstandingByAssignmentId } from "../../data/mock";

export default function Understanding() {
  const { id = "" } = useParams();
  const entry = getUnderstandingByAssignmentId(id);
  const [summary, setSummary] = useState(entry?.summary.join("\n\n") ?? "");
  const [concepts, setConcepts] = useState(entry?.keyConcepts ?? []);
  const [evidence, setEvidence] = useState(entry?.expectedEvidence ?? []);

  return (
    <div className="mx-auto max-w-[880px] space-y-6">
      <Card unstyled>
        <div className="border-l-2 border-forest px-6 py-6">
          <p className="text-11 uppercase tracking-widest text-mute">Summary</p>
          <textarea
            className="mt-3 min-h-[240px] w-full resize-none border-0 bg-transparent text-15 leading-[26px] text-ink focus:outline-none"
            onChange={(event) => setSummary(event.target.value)}
            value={summary}
          />
        </div>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card
          bodyClassName="space-y-3"
          header={<h2 className="text-16 font-medium text-ink">Key concepts the student should understand</h2>}
        >
          <div className="flex flex-wrap gap-2">
            {concepts.map((concept, index) => (
              <span className="rounded-sm2 border border-line bg-hover px-2.5 py-1 text-12 text-ink" key={`${concept}-${index}`}>
                {concept}
              </span>
            ))}
          </div>
          <button
            className="text-13 text-linkBlue transition-colors duration-150 ease-out hover:text-ink"
            onClick={() => setConcepts((current) => [...current, "Add concept"])}
            type="button"
          >
            + Add concept
          </button>
        </Card>
        <Card
          bodyClassName="space-y-3"
          header={<h2 className="text-16 font-medium text-ink">Expected forms of evidence</h2>}
        >
          <ul className="space-y-2">
            {evidence.map((item, index) => (
              <li className="flex items-start gap-3 text-14 text-ink" key={`${item}-${index}`}>
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-mute" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button
            className="text-13 text-linkBlue transition-colors duration-150 ease-out hover:text-ink"
            onClick={() => setEvidence((current) => [...current, "Add evidence expectation"])}
            type="button"
          >
            + Add evidence
          </button>
        </Card>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary">Regenerate</Button>
        <Button>Save</Button>
      </div>
    </div>
  );
}
