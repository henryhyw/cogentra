import { useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Field from "../../components/Field";
import Input from "../../components/Input";
import Select from "../../components/Select";
import { getSessionSettingsByAssignmentId } from "../../data/mock";
import { cn } from "../../lib/cn";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      aria-pressed={checked}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-150 ease-out",
        checked ? "bg-ink" : "bg-line",
      )}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span
        className={cn(
          "h-4 w-4 rounded-full bg-surface transition-transform duration-150 ease-out",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export default function SessionSettings() {
  const { id = "" } = useParams();
  const base = getSessionSettingsByAssignmentId(id);
  const [settings, setSettings] = useState({
    durationTargetMin: String(base?.durationTargetMin ?? 8),
    questionCount: String(base?.questionCount ?? 6),
    questionStyle: base?.questionStyle ?? "Probing",
    language: base?.language ?? "English",
    allowSkip: base?.allowSkip ?? true,
    requireCamera: base?.requireCamera ?? true,
    releaseDate: (base?.releaseAt ?? "2026-11-05T09:00").split("T")[0],
    releaseTime: (base?.releaseAt ?? "2026-11-05T09:00").split("T")[1],
    expiry: base?.expiry ?? "7 days",
    sampleQuestion: base?.sampleQuestion ?? "",
  });

  return (
    <div className="space-y-6">
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
          <div className="flex h-9 items-center rounded-md2 bg-hover p-1">
            {["Conversational", "Probing", "Strict"].map((option) => (
              <button
                className={cn(
                  "h-7 rounded-sm2 px-3 text-13 transition-all duration-150 ease-out",
                  settings.questionStyle === option ? "bg-surface text-ink shadow-e1" : "text-mute",
                )}
                key={option}
                onClick={() => setSettings((current) => ({ ...current, questionStyle: option as typeof current.questionStyle }))}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
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
        <Field help="Students may skip and revisit later within the session." label="Allow skip per question">
          <Toggle checked={settings.allowSkip} onChange={(value) => setSettings((current) => ({ ...current, allowSkip: value }))} />
        </Field>
        <Field label="Require camera on">
          <Toggle
            checked={settings.requireCamera}
            onChange={(value) => setSettings((current) => ({ ...current, requireCamera: value }))}
          />
        </Field>
        <Field label="Release date/time">
          <div className="grid grid-cols-2 gap-3">
            <Input
              onChange={(event) => setSettings((current) => ({ ...current, releaseDate: event.target.value }))}
              type="date"
              value={settings.releaseDate}
            />
            <Input
              onChange={(event) => setSettings((current) => ({ ...current, releaseTime: event.target.value }))}
              type="time"
              value={settings.releaseTime}
            />
          </div>
        </Field>
        <Field label="Expiry">
          <Select
            onChange={(event) => setSettings((current) => ({ ...current, expiry: event.target.value as typeof current.expiry }))}
            options={[
              { label: "24h", value: "24h" },
              { label: "3 days", value: "3 days" },
              { label: "7 days", value: "7 days" },
              { label: "No expiry", value: "No expiry" },
            ]}
            value={settings.expiry}
          />
        </Field>
      </Card>

      <Card
        bodyClassName="space-y-2"
        header={<h2 className="text-16 font-medium text-ink">Preview</h2>}
      >
        <p className="display text-22 text-ink">{settings.sampleQuestion}</p>
        <p className="text-12 text-mute">The student sees this first.</p>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary">Reset</Button>
        <Button>Save</Button>
      </div>
    </div>
  );
}
