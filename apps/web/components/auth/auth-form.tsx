"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Input, Panel } from "@oralv/ui";

import { apiPost } from "@/lib/api";

const signupSchema = z.object({
  full_name: z.string().min(2),
  email: z.email(),
  password: z.string().min(10),
  organization_name: z.string().min(2)
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
});

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<any>({
    resolver: zodResolver((mode === "signup" ? signupSchema : loginSchema) as any) as any,
    defaultValues:
      mode === "signup"
        ? {
            full_name: "Avery Hart",
            email: "owner@northstar.ac",
            password: "ChangeMe123!",
            organization_name: "Northstar Academy"
          }
        : {
            email: "owner@northstar.ac",
            password: "ChangeMe123!"
          }
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      form.clearErrors("root");
      try {
        await apiPost(mode === "signup" ? "/auth/signup" : "/auth/login", values);
        router.push("/app");
      } catch (error) {
        form.setError("root", {
          message: error instanceof Error ? error.message : "Unable to continue"
        });
      }
    });
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--canvas)] px-4 py-10 text-[var(--ink)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(188,135,82,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(66,89,121,0.18),transparent_34%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_0.85fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-xl"
        >
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--muted)]">Oral Verification OS</p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
            Verify understanding with structured, asynchronous oral defense.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[var(--muted)]">
            Turn assignment context, rubric criteria, and submitted work into a reviewer-first
            defense plan, student session, and decision-ready evidence trail.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full border border-[var(--line)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
              Summary-first review
            </span>
            <span className="rounded-full border border-[var(--line)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
              Audit-ready decisions
            </span>
          </div>
        </motion.div>
        <Panel className="mx-auto w-full max-w-md p-8">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--muted)]">
            {mode === "signup" ? "Create workspace" : "Reviewer sign in"}
          </p>
          <h2 className="mt-4 text-2xl font-semibold">
            {mode === "signup" ? "Start with a live demo-ready org" : "Welcome back"}
          </h2>
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            {mode === "signup" ? (
              <>
                <Input placeholder="Full name" {...form.register("full_name")} />
                <Input placeholder="Organization name" {...form.register("organization_name")} />
              </>
            ) : null}
            <Input placeholder="Email" type="email" {...form.register("email")} />
            <Input placeholder="Password" type="password" {...form.register("password")} />
            {form.formState.errors.root ? (
              <p className="text-sm text-rose-400">{form.formState.errors.root.message}</p>
            ) : null}
            <Button className="w-full" disabled={isPending} size="lg" type="submit">
              {isPending ? "Working..." : mode === "signup" ? "Create org and continue" : "Continue to workspace"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-[var(--muted)]">
            {mode === "signup" ? "Already have an account?" : "Need a new workspace?"}{" "}
            <Link
              className="font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
              href={mode === "signup" ? "/login" : "/signup"}
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </Link>
          </p>
        </Panel>
      </div>
    </div>
  );
}
