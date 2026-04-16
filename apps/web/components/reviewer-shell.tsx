"use client";

import { BookOpenText, Gauge, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppShell, LoadingSkeleton } from "@concentra/ui";

import { useAuth } from "@/lib/auth";

export function ReviewerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, session } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, router, session]);

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  return (
    <AppShell
      navItems={[
        { href: "/assignments?view=dashboard", label: "Dashboard", icon: <Gauge className="size-4" /> },
        { href: "/assignments?view=list", label: "Assignments", icon: <BookOpenText className="size-4" /> },
        { href: "/settings", label: "Settings", icon: <Settings2 className="size-4" /> },
      ]}
    >
      {children}
    </AppShell>
  );
}
