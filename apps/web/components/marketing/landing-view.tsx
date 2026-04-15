"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BrainCircuit, FolderSync, Shield, Sparkle, Waves } from "lucide-react";

import { Badge, Button, Panel } from "@oralv/ui";

const workflow = [
  {
    title: "Context in",
    body: "Assignment brief, rubric, supporting notes, and multiple student submissions are parsed into a normalized case record.",
    icon: FolderSync
  },
  {
    title: "Defense generated",
    body: "The platform extracts defensible claims, ambiguity points, and reviewer-editable questions with rationale and timing.",
    icon: Sparkle
  },
  {
    title: "Evidence out",
    body: "Async oral responses become transcripts, evidence snippets, competency states, and an audit-ready decision trail.",
    icon: Shield
  }
];

export function LandingView() {
  return (
    <div className="min-h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <section className="relative isolate min-h-screen overflow-hidden px-4 pb-10 pt-6 md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(193,134,84,0.18),transparent_32%),radial-gradient(circle_at_90%_20%,rgba(74,94,128,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col">
          <header className="flex items-center justify-between py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--muted)]">Oral Verification OS</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Submission-aware oral verification for education and training</p>
            </div>
            <div className="flex gap-3">
              <Link className="hidden rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)] sm:inline-flex" href="/login">
                Sign in
              </Link>
              <Link href="/signup">
                <Button size="lg">Create workspace</Button>
              </Link>
            </div>
          </header>
          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.82fr_1fr]">
            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge>Reviewer-first platform</Badge>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.96] tracking-[-0.04em] md:text-7xl">
                Turn submitted work into a defendable, asynchronous oral evidence workflow.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">
                Not an LMS. Not a plagiarism detector. A human-in-the-loop operating system for reviewers who need to verify whether students can truly explain and defend their own work.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button size="lg">
                    Launch demo-ready org
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="ghost">
                    Explore seeded workspace
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08, duration: 0.55 }}
              className="relative"
            >
              <div className="absolute inset-0 -translate-y-6 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(188,135,82,0.22),transparent_55%)] blur-2xl" />
              <Panel className="grid gap-5 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)),var(--surface)] p-5 md:grid-cols-[0.84fr_0.96fr]">
                <div className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Urban Mobility Policy Essay</p>
                    <Badge>Ready for review</Badge>
                  </div>
                  <div className="mt-5 space-y-3">
                    {["Tradeoff analysis", "Evidence use", "Implementation sequencing"].map((item, index) => (
                      <div key={item} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Focus {index + 1}</p>
                        <p className="mt-2 text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)]">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Reviewer summary</p>
                      <p className="text-xs text-[var(--muted)]">Verified competencies and unresolved areas</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/8 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Verified</p>
                      <p className="mt-2 text-sm">Student explained phase sequencing and stakeholder tradeoffs with concrete evidence from the essay.</p>
                    </div>
                    <div className="rounded-[24px] border border-amber-500/18 bg-amber-500/8 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-amber-200">Unresolved</p>
                      <p className="mt-2 text-sm">Causal chain between curb pricing and bus reliability needs more specific explanation.</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--line)] pt-4 text-sm text-[var(--muted)]">
                      <span>Audit trace captured</span>
                      <Waves className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Panel>
            </motion.div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-24 md:grid-cols-3 md:px-8">
        {workflow.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <Panel className="h-full p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--panel-strong)]">
                  <Icon className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
              </Panel>
            </motion.div>
          );
        })}
      </section>
    </div>
  );
}
