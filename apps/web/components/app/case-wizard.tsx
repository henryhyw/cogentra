"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FileStack, FileText, NotebookPen, Presentation, Wand2 } from "lucide-react";
import type { ArtifactKind, AssignmentFamily } from "@oralv/types";

import { Badge, Button, Input, Panel, Textarea } from "@oralv/ui";

import { apiPost } from "@/lib/api";
import { useIntakeStore } from "@/store/intake-store";

const familyOptions: { value: AssignmentFamily; label: string; body: string; icon: typeof FileText }[] = [
  { value: "report", label: "Report / Essay", body: "Long-form argument, analysis, or reflection.", icon: FileText },
  { value: "presentation", label: "Presentation / Slides", body: "Deck-backed oral or visual argument.", icon: Presentation },
  { value: "project", label: "Project / Proposal", body: "Applied project framing, options, and execution.", icon: Wand2 },
  { value: "technical", label: "Technical / Notebook / Code", body: "Notebook, code bundle, model, or technical artifact.", icon: NotebookPen }
];

const classify = (filename: string): ArtifactKind => {
  const lower = filename.toLowerCase();
  if (lower.includes("rubric") || lower.includes("criteria")) return "rubric";
  if (lower.includes("assignment") || lower.includes("brief") || lower.includes("instruction")) return "assignment";
  if (lower.includes("reference") || lower.includes("notes")) return "reference";
  return "submission";
};

export function CaseWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const store = useIntakeStore();
  const metaForm = useForm({
    defaultValues: {
      title: store.title || "",
      description: store.description || "",
      courseName: store.courseName || "",
      assignmentFamily: store.assignmentFamily
    }
  });

  const kindOverrides = useMemo(
    () =>
      Object.fromEntries(
        store.files.map((item) => [item.file.name, item.kind])
      ),
    [store.files]
  );

  const onMetaSubmit = metaForm.handleSubmit((values) => {
    store.setMeta({
      title: values.title,
      description: values.description,
      courseName: values.courseName,
      assignmentFamily: values.assignmentFamily as AssignmentFamily
    });
    setStep(2);
  });

  async function createCaseAndUpload() {
    setError(null);
    setBusyLabel("Creating case");
    try {
      const created = await apiPost<{ case: { id: string } }>("/cases", {
        title: store.title,
        description: store.description,
        course_name: store.courseName,
        assignment_family: store.assignmentFamily
      });
      const formData = new FormData();
      store.files.forEach((item) => formData.append("files", item.file));
      formData.append("kind_overrides", JSON.stringify(kindOverrides));
      setBusyLabel("Uploading artifacts");
      await apiPost(`/cases/${created.case.id}/artifacts`, formData);
      setBusyLabel("Generating defense plans");
      await apiPost(`/cases/${created.case.id}/process`);
      store.reset();
      router.push(`/app/cases/${created.case.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create case");
    } finally {
      setBusyLabel(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {[1, 2].map((item) => (
          <div key={item} className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${step >= item ? "border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--accent)]" : "border-[var(--line)] text-[var(--muted)]"}`}>
              {item}
            </div>
            {item < 2 ? <div className="h-px w-10 bg-[var(--line)]" /> : null}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Step 1</p>
          <h2 className="mt-3 text-2xl font-semibold">Define the assessment case</h2>
          <form className="mt-8 space-y-6" onSubmit={onMetaSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Case title" {...metaForm.register("title", { required: true })} />
              <Input placeholder="Course or program" {...metaForm.register("courseName")} />
            </div>
            <Textarea placeholder="Case description" {...metaForm.register("description")} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {familyOptions.map((item) => {
                const Icon = item.icon;
                const selected = metaForm.watch("assignmentFamily") === item.value;
                return (
                  <button
                    className={`rounded-[26px] border p-5 text-left transition ${selected ? "border-[var(--accent)] bg-[var(--accent)]/8" : "border-[var(--line)] bg-[var(--panel)] hover:border-[var(--ink)]/20"}`}
                    key={item.value}
                    onClick={(event) => {
                      event.preventDefault();
                      metaForm.setValue("assignmentFamily", item.value);
                    }}
                    type="button"
                  >
                    <Icon className="h-5 w-5 text-[var(--accent)]" />
                    <p className="mt-4 font-medium">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
                  </button>
                );
              })}
            </div>
            <Button size="lg" type="submit">Continue to artifacts</Button>
          </form>
        </Panel>
      ) : (
        <Panel>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Step 2</p>
              <h2 className="mt-3 text-2xl font-semibold">Upload and classify case materials</h2>
            </div>
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
          </div>
          <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--line)] bg-[var(--panel)] px-6 py-16 text-center">
            <FileStack className="h-8 w-8 text-[var(--accent)]" />
            <p className="mt-4 text-base font-medium">Drop files here or choose uploads</p>
            <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
              Supported for v1: PDF, DOCX, TXT, MD, PPTX, and ZIP bundles.
            </p>
            <input
              className="hidden"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []).map((file) => ({
                  file,
                  kind: classify(file.name)
                }));
                store.addFiles(files);
              }}
              type="file"
            />
          </label>
          <div className="mt-8 space-y-4">
            {store.files.length ? (
              store.files.map((item) => (
                <div key={item.file.name} className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="font-medium">{item.file.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{Math.round(item.file.size / 1024)} KB</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      className="rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-2 text-sm"
                      onChange={(event) => store.updateKind(item.file.name, event.target.value as ArtifactKind)}
                      value={item.kind}
                    >
                      {["assignment", "rubric", "submission", "reference"].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <Badge>{item.kind}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No artifacts added yet.</p>
            )}
          </div>
          {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button disabled={!store.files.length || !!busyLabel} onClick={createCaseAndUpload} size="lg">
              {busyLabel ?? "Create case and generate plans"}
            </Button>
            {busyLabel ? <Badge>{busyLabel}</Badge> : null}
          </div>
        </Panel>
      )}
    </div>
  );
}
