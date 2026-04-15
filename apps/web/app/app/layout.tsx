"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { useAuth } from "@/hooks/use-auth";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth.isError) {
      router.push("/login");
    }
  }, [auth.isError, router]);

  return <AppShell>{children}</AppShell>;
}
