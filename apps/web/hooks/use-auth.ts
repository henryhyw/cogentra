"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";

export function useAuth() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () =>
      apiGet<{
        user: { id: string; email: string; full_name: string };
        organization_id: string;
        role: "owner" | "admin" | "reviewer";
        csrf_token: string;
      }>("/auth/me"),
    retry: false
  });
}
