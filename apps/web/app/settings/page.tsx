"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoonStar, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge, Button, Card, PageHeader } from "@concentra/ui";

import { ReviewerShell } from "@/components/reviewer-shell";
import { api } from "@/lib/api";
import { useTheme } from "@/lib/theme";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings,
  });
  const [localSettings, setLocalSettings] = useState<any | null>(null);

  useEffect(() => {
    if (settingsQuery.data) {
      setLocalSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.patchSettings(payload),
    onSuccess: () => {
      toast.success("Settings updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return (
    <ReviewerShell>
      <PageHeader
        title="Settings"
        subtitle="Keep the reviewer surface minimal: profile, theme, and default session preferences."
      />

      {localSettings ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MoonStar className="size-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Profile & theme</p>
                <p className="text-sm text-muted-foreground">Reviewer identity and workspace tone.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Reviewer</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{localSettings.profile.displayName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{localSettings.profile.email}</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Role</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{localSettings.profile.role}</p>
                <div className="mt-3">
                  <Badge tone="primary">Demo-aware workspace</Badge>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <label className="text-sm font-medium text-foreground">Theme</label>
              <select
                value={theme}
                onChange={(event) => {
                  const next = event.target.value as "dark" | "light" | "system";
                  setTheme(next);
                  updateMutation.mutate({ theme: next });
                }}
                className="w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/5 text-primary">
                <SlidersHorizontal className="size-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Default session preferences</p>
                <p className="text-sm text-muted-foreground">Used when new assignments are created.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Questions</label>
                <input
                  type="number"
                  value={localSettings.defaultSessionPreferences.questionCount}
                  onChange={(event) =>
                    setLocalSettings((current: any) => ({
                      ...current,
                      defaultSessionPreferences: {
                        ...current.defaultSessionPreferences,
                        questionCount: Number(event.target.value),
                      },
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Answer duration</label>
                <input
                  type="number"
                  value={localSettings.defaultSessionPreferences.answerDurationSeconds}
                  onChange={(event) =>
                    setLocalSettings((current: any) => ({
                      ...current,
                      defaultSessionPreferences: {
                        ...current.defaultSessionPreferences,
                        answerDurationSeconds: Number(event.target.value),
                      },
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Response mode</label>
                <select
                  value={localSettings.defaultSessionPreferences.responseMode}
                  onChange={(event) =>
                    setLocalSettings((current: any) => ({
                      ...current,
                      defaultSessionPreferences: {
                        ...current.defaultSessionPreferences,
                        responseMode: event.target.value,
                      },
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground outline-none"
                >
                  <option value="audio_only">Audio only</option>
                  <option value="audio_video">Audio + video</option>
                </select>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                <div>
                  <p className="font-medium text-foreground">Demo mode helpers</p>
                  <p className="text-sm text-muted-foreground">Keep seeded guidance and quick actions visible.</p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.demoModeHelpers}
                  onChange={(event) =>
                    setLocalSettings((current: any) => ({
                      ...current,
                      demoModeHelpers: event.target.checked,
                    }))
                  }
                />
              </div>
              <Button
                className="w-full"
                loading={updateMutation.isPending}
                onClick={() => updateMutation.mutate(localSettings)}
              >
                Save settings
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </ReviewerShell>
  );
}
