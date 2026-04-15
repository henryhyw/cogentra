"use client";

import { useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge, Button, Input, Panel } from "@oralv/ui";

import { apiGet, apiPost } from "@/lib/api";

export function SettingsView() {
  const [email, setEmail] = useState("faculty-observer@northstar.ac");
  const [role, setRole] = useState("reviewer");
  const queryClient = useQueryClient();
  const membersQuery = useQuery({
    queryKey: ["members"],
    queryFn: () =>
      apiGet<{
        members: Array<{ id: string; full_name: string; email: string; role: string; title: string | null }>;
        invites: Array<{ id: string; email: string; role: string; expires_at: string }>;
      }>("/members")
  });
  const templatesQuery = useQuery({
    queryKey: ["templates"],
    queryFn: () => apiGet<{ templates: Array<{ id: string; title: string; assignment_family: string; description?: string | null }> }>("/templates")
  });
  const inviteMutation = useMutation({
    mutationFn: () => apiPost("/members/invite", { email, role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["members"] });
    }
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
      <Panel>
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Members</p>
        <h2 className="mt-3 text-2xl font-semibold">Org access and invitations</h2>
        <div className="mt-6 space-y-3">
          {(membersQuery.data?.members ?? []).map((member) => (
            <div key={member.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{member.full_name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{member.email}</p>
                </div>
                <Badge>{member.role}</Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-4">
          <p className="font-medium">Invite a reviewer</p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Input value={email} onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)} />
            <select
              className="rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-2 text-sm"
              onChange={(event) => setRole(event.target.value)}
              value={role}
            >
              <option value="reviewer">reviewer</option>
              <option value="admin">admin</option>
            </select>
            <Button onClick={() => inviteMutation.mutate()}>
              {inviteMutation.isPending ? "Inviting..." : "Create invite"}
            </Button>
          </div>
        </div>
      </Panel>
      <Panel>
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Templates</p>
        <h2 className="mt-3 text-2xl font-semibold">Reusable assessment patterns</h2>
        <div className="mt-6 space-y-3">
          {(templatesQuery.data?.templates ?? []).map((template) => (
            <div key={template.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{template.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{template.description ?? "Reusable defense structure."}</p>
                </div>
                <Badge>{template.assignment_family}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
