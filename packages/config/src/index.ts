import { z } from "zod";

export const webEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:8000"),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().default(""),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().default(""),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().default(""),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().default(""),
  NEXT_PUBLIC_ENABLE_DEMO_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true")
});

export const apiModeSchema = z.enum(["auto", "demo", "google"]);

export const apiEnvSchema = z.object({
  CONCENTRA_MODE: apiModeSchema.default("auto"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().default(8000),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  DEMO_DATA_ROOT: z.string().default("demo-data"),
  DEMO_RUNTIME_ROOT: z.string().default("apps/api/runtime"),
  STORAGE_PROVIDER: z.enum(["auto", "demo", "gcs"]).default("auto"),
  AI_PROVIDER: z.enum(["auto", "demo", "vertex"]).default("auto"),
  SPEECH_PROVIDER: z.enum(["auto", "demo", "google"]).default("auto"),
  QUEUE_PROVIDER: z.enum(["auto", "local", "cloud_tasks"]).default("auto"),
  FIREBASE_PROJECT_ID: z.string().default(""),
  FIREBASE_CLIENT_EMAIL: z.string().default(""),
  FIREBASE_PRIVATE_KEY: z.string().default(""),
  FIREBASE_WEB_API_KEY: z.string().default(""),
  VERTEX_PROJECT_ID: z.string().default(""),
  VERTEX_LOCATION: z.string().default("us-central1"),
  VERTEX_MODEL_TEXT: z.string().default("gemini-2.0-flash"),
  VERTEX_MODEL_MULTIMODAL: z.string().default("gemini-2.0-flash"),
  GCS_BUCKET: z.string().default(""),
  GCS_SIGNED_URL_EXPIRY_SECONDS: z.coerce.number().default(900),
  CLOUD_TASKS_PROJECT_ID: z.string().default(""),
  CLOUD_TASKS_LOCATION: z.string().default(""),
  CLOUD_TASKS_QUEUE: z.string().default(""),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().default(""),
  DEMO_SIGNING_SECRET: z.string().default("concentra-demo-secret"),
  DEMO_SEED: z.string().default("concentra-v1")
});

export type WebEnv = z.infer<typeof webEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;

export const defaultSessionDefaults = {
  questionCount: 6,
  answerDurationSeconds: 120,
  allowRerecord: true,
  responseMode: "audio_only" as const
};

export const assignmentFamilyLabels = {
  report_essay: "Report / Essay",
  presentation_slides: "Presentation / Slides",
  technical_notebook: "Technical / Notebook",
  mixed_submission: "Mixed Submission"
} as const;

export const focusStatusLabels = {
  verified: "Verified",
  partially_verified: "Partially Verified",
  unclear: "Unclear",
  needs_follow_up: "Needs Follow-up"
} as const;

export const sessionStatusLabels = {
  not_sent: "Not Sent",
  sent: "Sent",
  in_progress: "In Progress",
  completed: "Completed",
  transcript_ready: "Transcript Ready",
  summary_ready: "Summary Ready"
} as const;

export const reviewStatusLabels = {
  not_started: "Not Started",
  needs_review: "Needs Review",
  reviewed: "Reviewed"
} as const;
