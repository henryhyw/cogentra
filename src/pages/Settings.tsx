import { useState } from "react";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import Card from "../components/Card";
import Field from "../components/Field";
import Input from "../components/Input";
import PageHeader from "../components/PageHeader";
import Select from "../components/Select";
import { reviewerUser } from "../data/mock";
import { cn } from "../lib/cn";

const sections = ["Profile", "Notifications", "Institution", "Session defaults", "Billing"] as const;

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

export default function Settings() {
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]>("Profile");
  const [notificationSettings, setNotificationSettings] = useState([
    { label: "Session completed", email: true, inApp: true },
    { label: "Submission processed", email: false, inApp: true },
    { label: "Assignment finished processing", email: true, inApp: true },
  ]);
  const [sessionDefaults, setSessionDefaults] = useState({
    duration: "8",
    questionCount: "6",
    style: "Probing",
    language: "English",
    allowSkip: true,
    requireCamera: true,
  });

  return (
    <div className="mx-auto max-w-[1240px] px-8 py-8">
      <PageHeader
        eyebrow="Workspace"
        subtitle="Personal reviewer preferences, workspace defaults, and institutional settings."
        title="Settings"
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className="space-y-1">
          {sections.map((section) => (
            <button
              className={cn(
                "relative flex h-9 w-full items-center rounded-md2 pl-2 pr-3 text-left text-14 text-ink2 transition-colors duration-150 ease-out hover:bg-hover",
                activeSection === section && "bg-hover font-medium text-ink",
              )}
              key={section}
              onClick={() => setActiveSection(section)}
              type="button"
            >
              {activeSection === section ? <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-forest" /> : null}
              {section}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeSection === "Profile" ? (
            <>
              <Card bodyClassName="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar name={reviewerUser.name} size={56} />
                  <Button variant="secondary">Change photo</Button>
                </div>
                <Field label="Name">
                  <Input defaultValue={reviewerUser.name} />
                </Field>
                <Field label="Email">
                  <Input defaultValue={reviewerUser.email} readOnly />
                </Field>
                <Field label="Role">
                  <Select
                    options={[
                      { label: "Reviewer", value: "Reviewer" },
                      { label: "Lead reviewer", value: "Lead reviewer" },
                      { label: "Admin", value: "Admin" },
                    ]}
                    value={reviewerUser.role}
                  />
                </Field>
                <Field label="Time zone">
                  <Select
                    options={[
                      { label: "Asia/Hong_Kong", value: "Asia/Hong_Kong" },
                      { label: "America/New_York", value: "America/New_York" },
                      { label: "Europe/London", value: "Europe/London" },
                    ]}
                    value="Asia/Hong_Kong"
                  />
                </Field>
              </Card>
              <div className="flex gap-2">
                <Button>Save changes</Button>
                <Button variant="ghost">Cancel</Button>
              </div>
            </>
          ) : null}

          {activeSection === "Notifications" ? (
            <>
              <Card
                bodyClassName="space-y-4"
                header={<h2 className="text-16 font-medium text-ink">Delivery preferences</h2>}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_80px_80px] gap-4 text-12 uppercase tracking-widest text-mute">
                  <span>Notification type</span>
                  <span>Email</span>
                  <span>In-app</span>
                </div>
                {notificationSettings.map((item, index) => (
                  <div className="grid grid-cols-[minmax(0,1fr)_80px_80px] gap-4 border-t border-line pt-4" key={item.label}>
                    <span className="text-14 text-ink">{item.label}</span>
                    <Toggle
                      checked={item.email}
                      onChange={(value) =>
                        setNotificationSettings((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, email: value } : entry,
                          ),
                        )
                      }
                    />
                    <Toggle
                      checked={item.inApp}
                      onChange={(value) =>
                        setNotificationSettings((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, inApp: value } : entry,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </Card>
              <div className="flex gap-2">
                <Button>Save changes</Button>
                <Button variant="ghost">Cancel</Button>
              </div>
            </>
          ) : null}

          {activeSection === "Institution" ? (
            <>
              <Card
                bodyClassName="space-y-3"
                header={<h2 className="text-16 font-medium text-ink">Institution</h2>}
              >
                <p className="text-15 text-ink">Harvard University — School of Arts and Sciences</p>
                <p className="text-14 text-mute">
                  Your institution manages reviewer provisioning, workspace billing, and roster integrations.
                </p>
                <button className="w-fit text-13 text-linkBlue transition-colors duration-150 ease-out hover:text-ink" type="button">
                  Contact admin
                </button>
              </Card>
              <div className="flex gap-2">
                <Button>Save changes</Button>
                <Button variant="ghost">Cancel</Button>
              </div>
            </>
          ) : null}

          {activeSection === "Session defaults" ? (
            <>
              <Card bodyClassName="grid gap-5 md:grid-cols-2">
                <Field label="Duration target">
                  <Select
                    onChange={(event) => setSessionDefaults((current) => ({ ...current, duration: event.target.value }))}
                    options={[
                      { label: "5 min", value: "5" },
                      { label: "8 min", value: "8" },
                      { label: "12 min", value: "12" },
                      { label: "15 min", value: "15" },
                    ]}
                    value={sessionDefaults.duration}
                  />
                </Field>
                <Field label="Number of questions">
                  <Select
                    onChange={(event) =>
                      setSessionDefaults((current) => ({ ...current, questionCount: event.target.value }))
                    }
                    options={[
                      { label: "4", value: "4" },
                      { label: "6", value: "6" },
                      { label: "8", value: "8" },
                    ]}
                    value={sessionDefaults.questionCount}
                  />
                </Field>
                <Field label="Question style">
                  <Select
                    onChange={(event) => setSessionDefaults((current) => ({ ...current, style: event.target.value }))}
                    options={[
                      { label: "Conversational", value: "Conversational" },
                      { label: "Probing", value: "Probing" },
                      { label: "Strict", value: "Strict" },
                    ]}
                    value={sessionDefaults.style}
                  />
                </Field>
                <Field label="Language">
                  <Select
                    onChange={(event) => setSessionDefaults((current) => ({ ...current, language: event.target.value }))}
                    options={[
                      { label: "English", value: "English" },
                      { label: "Spanish", value: "Spanish" },
                    ]}
                    value={sessionDefaults.language}
                  />
                </Field>
                <Field label="Allow skip per question">
                  <Toggle
                    checked={sessionDefaults.allowSkip}
                    onChange={(value) => setSessionDefaults((current) => ({ ...current, allowSkip: value }))}
                  />
                </Field>
                <Field label="Require camera on">
                  <Toggle
                    checked={sessionDefaults.requireCamera}
                    onChange={(value) => setSessionDefaults((current) => ({ ...current, requireCamera: value }))}
                  />
                </Field>
              </Card>
              <div className="flex gap-2">
                <Button>Save changes</Button>
                <Button variant="ghost">Cancel</Button>
              </div>
            </>
          ) : null}

          {activeSection === "Billing" ? (
            <>
              <Card bodyClassName="space-y-3">
                <p className="text-15 text-ink">Your institution covers this workspace.</p>
                <button className="w-fit text-13 text-linkBlue transition-colors duration-150 ease-out hover:text-ink" type="button">
                  Contact admin
                </button>
              </Card>
              <div className="flex gap-2">
                <Button>Save changes</Button>
                <Button variant="ghost">Cancel</Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
