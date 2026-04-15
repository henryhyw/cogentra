"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { Badge, Panel } from "@oralv/ui";

import { apiGet } from "@/lib/api";
import { titleize } from "@/lib/format";

export function AnalyticsView() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const analyticsQuery = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => apiGet<Record<string, number>>("/analytics/overview")
  });
  const casesQuery = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiGet<{ cases: Array<{ id: string; title: string }> }>("/cases")
  });
  const auditQuery = useQuery({
    queryKey: ["audit", selectedCaseId],
    enabled: Boolean(selectedCaseId),
    queryFn: () => apiGet<{ events: Array<{ id: string; created_at: string; event_type: string; actor_type: string }> }>(`/audit/cases/${selectedCaseId}`)
  });

  const chartData = Object.entries(analyticsQuery.data ?? {}).map(([key, value]) => ({
    label: titleize(key),
    value
  }));

  return (
    <div className="space-y-6">
      <Panel>
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Operational metrics</p>
        <div className="mt-5 h-64 rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="label" hide />
              <Tooltip />
              <Bar dataKey="value" fill="var(--accent)" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Audit timeline</p>
          <select
            className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm"
            onChange={(event) => setSelectedCaseId(event.target.value)}
            value={selectedCaseId ?? ""}
          >
            <option value="">Select case</option>
            {(casesQuery.data?.cases ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-6 space-y-3">
          {(auditQuery.data?.events ?? []).map((event) => (
            <div key={event.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--panel)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{titleize(event.event_type)}</p>
                <Badge>{event.actor_type}</Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{new Date(event.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
