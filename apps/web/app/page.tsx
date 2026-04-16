"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth";

export default function IndexPage() {
  const router = useRouter();
  const { loading, session } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(session ? "/assignments" : "/login");
  }, [loading, router, session]);

  return null;
}
