import type {
  Assignment,
  DashboardData,
  Settings,
} from "@concentra/schemas";

import { env, storageKeys } from "./env";

export type AuthSession = {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  mode: string;
};

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(storageKeys.auth);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (!session) {
    window.localStorage.removeItem(storageKeys.auth);
    return;
  }
  window.localStorage.setItem(storageKeys.auth, JSON.stringify(session));
}

export async function apiFetch<T>(path: string, init?: RequestInit, token?: string | null): Promise<T> {
  const session = getStoredSession();
  const resolvedToken = token ?? session?.token ?? null;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (resolvedToken) {
    headers.set("Authorization", `Bearer ${resolvedToken}`);
  }
  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(payload.detail ?? "Request failed");
  }
  return response.json() as Promise<T>;
}

export const api = {
  demoLogin: (email?: string) =>
    apiFetch<AuthSession>("/api/demo-login", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  me: () => apiFetch<{ user: unknown; mode: string }>("/api/me"),
  dashboard: () => apiFetch<DashboardData>("/api/dashboard"),
  assignments: () => apiFetch<Assignment[]>("/api/assignments"),
  assignment: (assignmentId: string) => apiFetch<any>(`/api/assignments/${assignmentId}`),
  createAssignment: (payload: { title: string; family: string; description?: string }) =>
    apiFetch<any>("/api/assignments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  patchAssignment: (assignmentId: string, payload: unknown) =>
    apiFetch<any>(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  artifactUploadUrl: (assignmentId: string, payload: { fileName: string; mimeType: string; contentLength: number }) =>
    apiFetch<any>(`/api/assignments/${assignmentId}/artifacts/upload-url`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  registerArtifact: (assignmentId: string, payload: unknown) =>
    apiFetch<any>(`/api/assignments/${assignmentId}/artifacts/register`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  patchArtifact: (assignmentId: string, artifactId: string, payload: unknown) =>
    apiFetch<any>(`/api/assignments/${assignmentId}/artifacts/${artifactId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  analyzeArtifacts: (assignmentId: string) =>
    apiFetch<any>(`/api/assignments/${assignmentId}/artifacts/analyze`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  importUploadUrl: (assignmentId: string, payload: { fileName: string; mimeType: string; contentLength: number }) =>
    apiFetch<any>(`/api/assignments/${assignmentId}/imports/upload-url`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  registerImportBatch: (assignmentId: string, payload: unknown) =>
    apiFetch<any>(`/api/assignments/${assignmentId}/imports/register-batch`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  analyzeImport: (assignmentId: string, importId: string) =>
    apiFetch<any>(`/api/assignments/${assignmentId}/imports/${importId}/analyze`, {
      method: "POST",
    }),
  fixImportMapping: (assignmentId: string, importId: string, payload: unknown) =>
    apiFetch<any>(`/api/assignments/${assignmentId}/imports/${importId}/fix-mapping`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createCases: (assignmentId: string, importId: string) =>
    apiFetch<any>(`/api/assignments/${assignmentId}/imports/${importId}/create-cases`, {
      method: "POST",
    }),
  caseDetails: (caseId: string) => apiFetch<any>(`/api/cases/${caseId}`),
  caseResult: (caseId: string) => apiFetch<any>(`/api/cases/${caseId}/result`),
  regenerateSessionLink: (caseId: string) =>
    apiFetch<any>(`/api/cases/${caseId}/regenerate-session-link`, {
      method: "POST",
    }),
  refreshCaseAnalysis: (caseId: string) =>
    apiFetch<any>(`/api/cases/${caseId}/refresh-analysis`, {
      method: "POST",
    }),
  updateReviewNote: (caseId: string, finalReviewerNote: string) =>
    apiFetch<any>(`/api/cases/${caseId}/review-note`, {
      method: "PATCH",
      body: JSON.stringify({ finalReviewerNote }),
    }),
  markReviewed: (caseId: string) =>
    apiFetch<any>(`/api/cases/${caseId}/mark-reviewed`, {
      method: "POST",
    }),
  session: (tokenValue: string) => apiFetch<any>(`/api/session/${tokenValue}`, { cache: "no-store" }),
  startSession: (tokenValue: string) =>
    apiFetch<any>(`/api/session/${tokenValue}/start`, { method: "POST" }),
  sessionUploadUrl: (tokenValue: string, payload: { fileName: string; mimeType: string; contentLength: number }) =>
    apiFetch<any>(`/api/session/${tokenValue}/upload-response-url`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  submitResponse: (tokenValue: string, payload: unknown) =>
    apiFetch<any>(`/api/session/${tokenValue}/submit-response`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  completeSession: (tokenValue: string) =>
    apiFetch<any>(`/api/session/${tokenValue}/complete`, {
      method: "POST",
    }),
  settings: () => apiFetch<Settings>("/api/settings"),
  patchSettings: (payload: unknown) =>
    apiFetch<Settings>("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export async function uploadFile(
  uploadUrl: string,
  file: Blob,
  mimeType: string,
  uploadHeaders?: Record<string, string>,
) {
  const headers = new Headers(uploadHeaders);
  if (mimeType) {
    headers.set("Content-Type", mimeType);
  }
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers,
    body: file,
  });
  if (!response.ok) {
    throw new Error("Upload failed");
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}
