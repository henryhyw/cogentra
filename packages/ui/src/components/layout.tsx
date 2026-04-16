"use client";

import { BellRing, BookOpenText, Gauge, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "../lib/utils";
import { Badge, Button } from "./primitives";

export type ShellNavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

export function AppSidebar({
  brand,
  items,
}: {
  brand: { title: string; subtitle: string };
  items?: ShellNavItem[];
}) {
  const pathname = usePathname();
  const navItems =
    items ??
    [
      { href: "/", label: "Dashboard", icon: <Gauge className="size-4" /> },
      { href: "/assignments", label: "Assignments", icon: <BookOpenText className="size-4" /> },
      { href: "/settings", label: "Settings", icon: <Settings2 className="size-4" /> },
    ];
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border/60 bg-[#070b16] px-5 py-6 lg:flex">
      <div className="space-y-4">
        <div className="rounded-3xl border border-border/60 bg-white/5 p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-slate-950 shadow-glow">
              C
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{brand.title}</p>
              <p className="text-xs text-muted-foreground">{brand.subtitle}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-black/30 p-3">
            <Badge tone="primary">Reviewer-first</Badge>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Submission-aware oral verification for grounded review decisions.
            </p>
          </div>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active ? "bg-white text-slate-950 shadow-panel" : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto rounded-3xl border border-border/60 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Live Queue</p>
            <p className="mt-1 text-lg font-semibold text-foreground">9 pending reviews</p>
          </div>
          <BellRing className="size-5 text-primary" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          The review surface prioritizes completed sessions with medium or high evidence ambiguity.
        </p>
      </div>
    </aside>
  );
}

export function AppShell({
  children,
  title = "Concentra",
  subtitle = "Submission-aware oral verification",
  navItems,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  navItems?: ShellNavItem[];
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.10),transparent_24%),linear-gradient(180deg,#030712_0%,#060c18_42%,#030611_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-grid-fade bg-[size:180px_180px] opacity-20" />
      <div className="relative flex min-h-screen">
        <AppSidebar brand={{ title, subtitle }} items={navItems} />
        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1640px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Concentra</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
        {subtitle ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border/70 bg-white/5 px-6 py-10 text-center">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorAlert({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-danger/40 bg-danger/10 p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
