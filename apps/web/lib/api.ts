"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api/v1";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")[1] ?? "";
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method?.toUpperCase() ?? "GET";
  const headers = new Headers(init.headers);
  const bodyIsForm = init.body instanceof FormData;
  if (!bodyIsForm && init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = readCookie(process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "oralv_csrf");
    if (csrf) {
      headers.set("x-csrf-token", decodeURIComponent(csrf));
    }
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include"
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new ApiError(
      (payload as { detail?: string })?.detail ?? "Request failed",
      response.status,
      payload
    );
  }
  return payload as T;
}

export function apiGet<T>(path: string) {
  return apiFetch<T>(path);
}

export function apiPost<T>(path: string, body?: BodyInit | Record<string, unknown>) {
  return apiFetch<T>(path, {
    method: "POST",
    body:
      body instanceof FormData || typeof body === "string"
        ? body
        : body
          ? JSON.stringify(body)
          : undefined
  });
}

export function apiPut<T>(path: string, body: Record<string, unknown>) {
  return apiFetch<T>(path, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}
