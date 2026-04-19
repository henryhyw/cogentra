import { ArrowRight, Check, GripVertical, Plus, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import Dropzone from "../components/Dropzone";
import Field from "../components/Field";
import IconButton from "../components/IconButton";
import Input from "../components/Input";
import Modal from "../components/Modal";
import Select from "../components/Select";
import Textarea from "../components/Textarea";
import { showcaseAssignmentId } from "../data/mock";
import { cn } from "../lib/cn";

const steps = ["Details", "Materials", "Understanding"] as const;

export default function CreateAssignment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState({
    name: "Research Essay — Theories of Justice",
    course: "PHIL 210 · Fall 2026",
    description: "Comparative essay on procedural and substantive justice with a required counter-example.",
    dueDate: "2026-11-11",
  });
  const [materials, setMaterials] = useState([
    { id: "brief", name: "brief.pdf", size: "182KB", type: "Brief" },
    { id: "rubric", name: "rubric.docx", size: "48KB", type: "Rubric" },
  ]);
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "material"; id: string }
    | { kind: "goal"; index: number }
    | null
  >(null);
  const [summary, setSummary] = useState(
    "This assignment asks students to defend a clear thesis about justice rather than merely compare positions. The strongest submissions should explain why one framework offers a better account of fairness in practice, and they should show how that framework handles at least one meaningful objection.\n\nCongentra identified Rawls' original position, the distinction between procedural and substantive justice, and the use of counter-examples as the central conceptual terrain. Reviewers should expect students to move beyond memorized definitions and to explain why these ideas matter to their own argument structure.",
  );
  const [goals, setGoals] = useState([
    "Confirm the student can explain their central thesis in their own words.",
    "Probe their understanding of Rawls' original position beyond textbook phrasing.",
    "Verify that claims tied to specific citations are genuinely theirs.",
    "Check reasoning behind their chosen counter-example.",
  ]);
  const [settings, setSettings] = useState({
    durationTargetMin: "8",
    questionCount: "6",
    questionStyle: "Probing",
    language: "English",
  });

  return (
    <div className="px-8 py-12">
      <div className="mx-auto max-w-[760px] space-y-10">
        <div className="flex items-center gap-4">
          {steps.map((item, index) => {
            const isDone = index < step;
            const isActive = index === step;

            return (
              <div className="flex flex-1 items-center gap-4" key={item}>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full border text-12 font-medium",
                      isDone
                        ? "border-forest bg-forestSoft text-forest"
                        : isActive
                          ? "border-ink bg-surface text-ink"
                          : "border-line text-mute",
                    )}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={cn("text-13", isActive ? "text-ink" : "text-mute")}>{item}</span>
                </div>
                {index < steps.length - 1 ? <div className="h-px flex-1 bg-line" /> : null}
              </div>
            );
          })}
        </div>

        {step === 0 ? (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="display text-36 text-ink">New assignment</h1>
              <p className="text-15 text-mute">
                Give us a name and enough context for the system to read the rest.
              </p>
            </div>
            <div className="space-y-5">
              <Field label="Name">
                <Input
                  onChange={(event) => setDetails((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Research Essay — Theories of Justice"
                  value={details.name}
                />
              </Field>
              <Field label="Course / Class">
                <Input
                  onChange={(event) => setDetails((current) => ({ ...current, course: event.target.value }))}
                  placeholder="PHIL 210 · Fall 2026"
                  value={details.course}
                />
              </Field>
              <Field label="Short description">
                <Textarea
                  onChange={(event) => setDetails((current) => ({ ...current, description: event.target.value }))}
                  placeholder="One or two lines reviewers will see in the list."
                  value={details.description}
                />
              </Field>
              <Field label="Due date">
                <Input
                  onChange={(event) => setDetails((current) => ({ ...current, dueDate: event.target.value }))}
                  type="date"
                  value={details.dueDate}
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(1)} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="display text-36 text-ink">Materials</h1>
              <p className="text-15 text-mute">
                Upload the assignment brief, rubric, and any reference material you want Congentra to understand.
              </p>
            </div>
            <Dropzone />
            <div className="space-y-3">
              {materials.map((artifact) => (
                <Card className="shadow-none" key={artifact.id} unstyled>
                  <div className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px_120px_40px] md:items-center">
                    <div>
                      <p className="text-14 font-medium text-ink">{artifact.name}</p>
                      <p className="mono text-12 text-mute">{artifact.size}</p>
                    </div>
                    <Select
                      onChange={(event) =>
                        setMaterials((current) =>
                          current.map((item) =>
                            item.id === artifact.id ? { ...item, type: event.target.value } : item,
                          ),
                        )
                      }
                      options={[
                        { label: "Brief", value: "Brief" },
                        { label: "Rubric", value: "Rubric" },
                        { label: "Reference", value: "Reference" },
                        { label: "Example", value: "Example" },
                      ]}
                      value={artifact.type}
                    />
                    <p className="text-12 text-mute">{artifact.type}</p>
                    <IconButton
                      aria-label="Remove artifact"
                      onClick={() => setDeleteTarget({ kind: "material", id: artifact.id })}
                    >
                      <X className="h-4 w-4" />
                    </IconButton>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex justify-between">
              <Button onClick={() => setStep(0)} variant="ghost">
                Back
              </Button>
              <Button onClick={() => setStep(2)} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="display text-28 text-ink">Here&apos;s what Congentra understood.</h1>
              <p className="text-15 text-mute">
                Review and edit. You can always change these later inside the assignment.
              </p>
            </div>
            <Card
              bodyClassName="space-y-4"
              header={
                <div className="space-y-1">
                  <p className="text-11 uppercase tracking-widest text-mute">Summary</p>
                  <h2 className="text-16 font-medium text-ink">Assignment understanding</h2>
                </div>
              }
            >
              <Textarea
                className="min-h-[180px] text-15 leading-[26px]"
                onChange={(event) => setSummary(event.target.value)}
                value={summary}
              />
            </Card>
            <Card
              bodyClassName="space-y-3"
              header={<h2 className="text-16 font-medium text-ink">Verification goals</h2>}
            >
              {goals.map((goal, index) => (
                <div className="grid gap-3 md:grid-cols-[20px_32px_minmax(0,1fr)_40px]" key={`${goal}-${index}`}>
                  <GripVertical className="mt-2 h-4 w-4 text-mute" />
                  <span className="mono inline-flex h-8 w-8 items-center justify-center rounded-sm2 bg-hover text-13 text-ink">
                    {index + 1}
                  </span>
                  <Input
                    onChange={(event) =>
                      setGoals((current) =>
                        current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                      )
                    }
                    value={goal}
                  />
                  <IconButton
                    aria-label="Delete goal"
                    onClick={() => setDeleteTarget({ kind: "goal", index })}
                  >
                    <X className="h-4 w-4" />
                  </IconButton>
                </div>
              ))}
              <button
                className="inline-flex items-center gap-2 text-13 text-linkBlue transition-colors duration-150 ease-out hover:text-ink"
                onClick={() => setGoals((current) => [...current, "Add a new verification goal."])}
                type="button"
              >
                <Plus className="h-4 w-4" />
                Add goal
              </button>
            </Card>
            <Card
              bodyClassName="grid gap-5 md:grid-cols-2"
              header={<h2 className="text-16 font-medium text-ink">Session settings</h2>}
            >
              <Field label="Duration target">
                <Select
                  onChange={(event) => setSettings((current) => ({ ...current, durationTargetMin: event.target.value }))}
                  options={[
                    { label: "5 min", value: "5" },
                    { label: "8 min", value: "8" },
                    { label: "12 min", value: "12" },
                    { label: "15 min", value: "15" },
                  ]}
                  value={settings.durationTargetMin}
                />
              </Field>
              <Field label="Number of questions">
                <Select
                  onChange={(event) => setSettings((current) => ({ ...current, questionCount: event.target.value }))}
                  options={[
                    { label: "4", value: "4" },
                    { label: "6", value: "6" },
                    { label: "8", value: "8" },
                  ]}
                  value={settings.questionCount}
                />
              </Field>
              <Field label="Question style">
                <Select
                  onChange={(event) => setSettings((current) => ({ ...current, questionStyle: event.target.value }))}
                  options={[
                    { label: "Conversational", value: "Conversational" },
                    { label: "Probing", value: "Probing" },
                    { label: "Strict", value: "Strict" },
                  ]}
                  value={settings.questionStyle}
                />
              </Field>
              <Field label="Language">
                <Select
                  onChange={(event) => setSettings((current) => ({ ...current, language: event.target.value }))}
                  options={[
                    { label: "English", value: "English" },
                    { label: "Spanish", value: "Spanish" },
                    { label: "French", value: "French" },
                  ]}
                  value={settings.language}
                />
              </Field>
            </Card>
            <div className="flex justify-between">
              <Button onClick={() => setStep(1)} variant="ghost">
                Back
              </Button>
              <Button
                onClick={() => navigate(`/assignments/${showcaseAssignmentId}`)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Create assignment
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <Modal
        footer={
          <>
            <Button onClick={() => setDeleteTarget(null)} variant="ghost">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteTarget?.kind === "material") {
                  setMaterials((current) => current.filter((item) => item.id !== deleteTarget.id));
                }
                if (deleteTarget?.kind === "goal") {
                  setGoals((current) => current.filter((_, itemIndex) => itemIndex !== deleteTarget.index));
                }
                setDeleteTarget(null);
              }}
              variant="danger"
            >
              Remove
            </Button>
          </>
        }
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget?.kind === "material" ? "Remove material?" : "Delete goal?"}
      >
        <p className="text-14 text-mute">
          {deleteTarget?.kind === "material"
            ? "This removes the uploaded artifact from the assignment setup."
            : "This removes the goal from the step-three review."}
        </p>
      </Modal>
    </div>
  );
}
