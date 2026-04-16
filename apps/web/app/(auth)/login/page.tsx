"use client";

import { ArrowRight, Mail, Mic, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, Card, Input } from "@concentra/ui";

import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { demoLogin, emailLinkLogin, googleLogin, completeEmailLink, loading, session } = useAuth();
  const [email, setEmail] = useState("demo@concentra.app");
  const [busy, setBusy] = useState<"demo" | "google" | "email" | null>(null);

  useEffect(() => {
    if (session) {
      window.location.replace("/assignments");
    }
  }, [session]);

  async function run(label: typeof busy, task: () => Promise<void>) {
    setBusy(label);
    try {
      await task();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.href.includes("oobCode")) return;
    run("email", async () => {
      await completeEmailLink(email);
      toast.success("Email sign-in completed");
    });
  }, [completeEmailLink, email]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden border-b border-border/60 px-6 py-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_28%),radial-gradient(circle_at_68%_18%,rgba(129,140,248,0.2),transparent_22%),linear-gradient(180deg,rgba(7,12,26,0.98),rgba(2,6,15,1))]" />
          <div className="absolute inset-0 bg-grid-fade bg-[size:180px_180px] opacity-20" />
          <div className="relative mx-auto flex h-full max-w-2xl flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground">
                <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 font-semibold text-slate-950">
                  C
                </div>
                Concentra
              </div>
              <div className="mt-12 max-w-xl space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary-foreground">
                  <Sparkles className="size-3" />
                  Reviewer-first assessment intelligence
                </div>
                <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-foreground">
                  Submission-aware oral verification for genuine understanding.
                </h1>
                <p className="max-w-lg text-base leading-8 text-muted-foreground">
                  Congentra turns assignment artifacts, student submissions, and async oral responses into a review workspace that surfaces what actually needs to be verified.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: <ShieldCheck className="size-5 text-primary" />,
                  title: "Grounded evidence",
                  body: "Focus points, questions, and inconsistencies stay linked to source sections and transcript evidence.",
                },
                {
                  icon: <Mic className="size-5 text-primary" />,
                  title: "Async oral sessions",
                  body: "Students answer targeted questions without needing a live slot or a heavy portal workflow.",
                },
                {
                  icon: <Mail className="size-5 text-primary" />,
                  title: "Fast reviewer flow",
                  body: "Reviewers start with summary, focus point status, and evidence cards instead of transcript sprawl.",
                },
              ].map((item) => (
                <Card key={item.title} className="border-white/10 bg-white/5 p-5">
                  {item.icon}
                  <p className="mt-4 text-lg font-semibold text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 lg:px-10">
          <Card className="w-full max-w-md p-8">
            <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Reviewer access</p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">Enter your workspace</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Sign in with Firebase Auth or open the seeded demo workspace instantly.
            </p>

            <div className="mt-8 space-y-4">
              <Button className="w-full justify-between" loading={busy === "google"} disabled={loading} onClick={() => run("google", googleLogin)}>
                Sign in with Google
                <ArrowRight className="size-4" />
              </Button>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email link sign-in</label>
                <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="reviewer@school.edu" />
                <Button variant="secondary" className="w-full" loading={busy === "email"} disabled={!email} onClick={() => run("email", () => emailLinkLogin(email))}>
                  Send sign-in link
                </Button>
              </div>

              <div className="rounded-3xl border border-primary/20 bg-primary/10 p-4">
                <p className="text-sm font-semibold text-foreground">Try demo workspace</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Open a complete seeded reviewer workspace with three assignments, imported student bundles, finished oral sessions, and ready-to-review case reports.
                </p>
                <Button className="mt-4 w-full" loading={busy === "demo"} onClick={() => run("demo", () => demoLogin(email))}>
                  Try demo workspace
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
