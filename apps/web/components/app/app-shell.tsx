"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BookTemplate, CircleUserRound, Files, LayoutGrid, ShieldCheck } from "lucide-react";

import { Button, cn } from "@oralv/ui";

import { apiPost } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/app", label: "Cases", icon: LayoutGrid },
  { href: "/app/analytics", label: "Audit & Analytics", icon: Activity },
  { href: "/app/settings", label: "Settings", icon: CircleUserRound }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 md:px-6">
        <aside className="hidden w-[252px] shrink-0 rounded-[34px] border border-[var(--line)] bg-[var(--panel)]/92 p-5 shadow-[0_28px_80px_rgba(4,6,10,0.08)] lg:flex lg:flex-col">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--muted)]">Oral Verification OS</p>
              <p className="mt-3 text-lg font-semibold">Decision cockpit</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div className="mb-6 rounded-[24px] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
            <p className="text-sm font-medium">{auth.data?.user.full_name ?? "Reviewer"}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{auth.data?.user.email ?? "Loading..."}</p>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                    active
                      ? "bg-[var(--ink)] text-[var(--canvas)]"
                      : "text-[var(--muted)] hover:bg-[var(--panel-strong)] hover:text-[var(--ink)]"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]"
              href="/app/cases/new"
            >
              <Files className="h-4 w-4" />
              New assessment case
            </Link>
          </nav>
          <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-5">
            <ThemeToggle />
            <Button
              variant="subtle"
              onClick={async () => {
                await apiPost("/auth/logout");
                router.push("/login");
              }}
            >
              Sign out
            </Button>
          </div>
        </aside>
        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col overflow-hidden rounded-[34px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_24%),var(--surface)] shadow-[0_24px_100px_rgba(7,9,12,0.08)]">
          <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 md:px-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Reviewer workspace</p>
              <h1 className="mt-2 text-xl font-semibold">Operational proof, not vibes</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                className="hidden rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--panel)] sm:inline-flex"
                href="/app/settings"
              >
                <BookTemplate className="mr-2 h-4 w-4" />
                Templates & members
              </Link>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto px-5 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
