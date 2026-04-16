import { z } from "zod";

export const timestampSchema = z.string().min(1);

export const assignmentFamilySchema = z.enum([
  "report_essay",
  "presentation_slides",
  "technical_notebook",
  "mixed_submission"
]);

export const assignmentStatusSchema = z.enum([
  "draft",
  "active",
  "processing",
  "ready",
  "archived"
]);

export const artifactRoleSchema = z.enum([
  "assignment_brief",
  "rubric",
  "teacher_note",
  "model_answer",
  "support_material",
  "primary_submission",
  "support_submission",
  "visual_submission",
  "technical_submission"
]);

export const sessionModeSchema = z.enum(["audio_only", "audio_video"]);
export const sessionStatusSchema = z.enum([
  "not_sent",
  "sent",
  "in_progress",
  "completed",
  "transcript_ready",
  "summary_ready"
]);

export const reviewStatusSchema = z.enum([
  "not_started",
  "needs_review",
  "reviewed"
]);

export const confidenceLabelSchema = z.enum(["high", "medium", "low"]);

export const reviewPrioritySchema = z.enum(["low", "medium", "high"]);
export const focusPointStatusSchema = z.enum([
  "verified",
  "partially_verified",
  "unclear",
  "needs_follow_up"
]);

export const evidenceQualitySchema = z.enum(["strong", "medium", "weak"]);

export const sourceRefSchema = z.object({
  artifactId: z.string().optional(),
  label: z.string(),
  sectionTitle: z.string().optional(),
  locator: z.string().optional(),
  excerpt: z.string().optional(),
  kind: z.enum(["assignment", "rubric", "submission", "transcript", "response"]),
  score: z.number().min(0).max(1).optional()
});

export const explainabilitySchema = z.object({
  why: z.string(),
  referencedSources: z.array(sourceRefSchema).default([]),
  modelConfidence: z.number().min(0).max(1),
  signals: z.array(z.string()).default([])
});

export const verificationGoalSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  enabled: z.boolean().default(true),
  order: z.number().int().default(0),
  confidence: z.number().min(0).max(1),
  explainability: explainabilitySchema.optional()
});

export const previewMetadataSchema = z.object({
  kind: z.enum(["document", "slides", "image_grid", "technical", "audio", "video"]),
  summary: z.string(),
  pageCount: z.number().int().optional(),
  slideCount: z.number().int().optional(),
  thumbnails: z.array(z.string()).default([]),
  highlightedSections: z.array(z.string()).default([])
});

export const extractedSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  order: z.number().int(),
  tags: z.array(z.string()).default([])
});

export const artifactSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  storagePath: z.string(),
  mimeType: z.string(),
  originalSize: z.number().int(),
  role: artifactRoleSchema,
  detectedRole: artifactRoleSchema,
  roleConfidence: z.number().min(0).max(1),
  extractedText: z.string(),
  extractedStructure: z.array(extractedSectionSchema).default([]),
  previewMetadata: previewMetadataSchema,
  createdAt: timestampSchema,
  explainability: explainabilitySchema.optional()
});

export const assignmentUnderstandingSchema = z.object({
  assignmentSummary: z.string(),
  assignmentFamily: assignmentFamilySchema,
  verificationGoals: z.array(verificationGoalSchema),
  expectedSubmissionCharacteristics: z.array(z.string()),
  defensibleAreas: z.array(z.string()),
  verificationDimensions: z.array(z.string()),
  preferredQuestionTypes: z.array(z.string()),
  avoidQuestionTypes: z.array(z.string()),
  reviewerFocusAdvice: z.array(z.string()),
  explainability: explainabilitySchema
});

export const sessionDefaultsSchema = z.object({
  questionCount: z.number().int().min(3).max(10),
  answerDurationSeconds: z.number().int().min(30).max(300),
  allowRerecord: z.boolean(),
  responseMode: sessionModeSchema
});

export const assignmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  family: assignmentFamilySchema,
  description: z.string().default(""),
  status: assignmentStatusSchema,
  createdBy: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  sessionDefaults: sessionDefaultsSchema,
  verificationGoals: z.array(verificationGoalSchema),
  aiSummary: z.string(),
  aiSummaryConfidence: z.number().min(0).max(1),
  assignmentUnderstanding: assignmentUnderstandingSchema,
  artifactCount: z.number().int(),
  caseCount: z.number().int(),
  completedSessionCount: z.number().int(),
  pendingReviewCount: z.number().int()
});

export const importStatusSchema = z.enum([
  "draft",
  "uploading",
  "analyzing",
  "ready",
  "blocked",
  "completed"
]);

export const importItemSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  storagePath: z.string(),
  detectedStudentIdentifier: z.string().optional(),
  matchedStudentIdentifier: z.string().optional(),
  detectedRole: artifactRoleSchema,
  confidence: z.number().min(0).max(1),
  bundleId: z.string().optional(),
  unresolvedReason: z.string().optional(),
  createdAt: timestampSchema
});

export const importBundleSchema = z.object({
  bundleId: z.string(),
  studentIdentifier: z.string(),
  studentName: z.string().optional(),
  studentEmail: z.string().optional(),
  fileCount: z.number().int(),
  submissionFamily: assignmentFamilySchema,
  confidence: z.number().min(0).max(1),
  unresolved: z.boolean().default(false)
});

export const importJobSchema = z.object({
  id: z.string(),
  createdAt: timestampSchema,
  createdBy: z.string(),
  status: importStatusSchema,
  sourceType: z.enum(["zip", "multi_file", "roster_csv", "mixed"]),
  rosterCsvPath: z.string().nullable(),
  filesCount: z.number().int(),
  detectedStudentsCount: z.number().int(),
  unresolvedItemsCount: z.number().int(),
  stageLabels: z.array(z.string()).default([]),
  importedArtifacts: z.array(importItemSchema).default([]),
  detectedBundles: z.array(importBundleSchema).default([])
});

export const focusPointSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  whyItMatters: z.string(),
  relatedGoals: z.array(z.string()),
  sourceRefs: z.array(sourceRefSchema),
  confidence: z.number().min(0).max(1),
  explainability: explainabilitySchema
});

export const generatedQuestionSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  text: z.string(),
  focusLabel: z.string(),
  focusPointId: z.string(),
  rationale: z.string(),
  expectedEvidence: z.string(),
  sourceRefs: z.array(sourceRefSchema),
  confidence: z.number().min(0).max(1),
  explainability: explainabilitySchema
});

export const previewFlagSchema = z.object({
  id: z.string(),
  tone: z.enum(["neutral", "attention", "warning"]),
  label: z.string(),
  detail: z.string(),
  confidence: z.number().min(0).max(1)
});

export const caseSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  studentIdentifier: z.string(),
  studentName: z.string().optional(),
  studentEmail: z.string().optional(),
  submissionFamily: assignmentFamilySchema,
  bundleArtifactIds: z.array(z.string()),
  aiConfidence: z.number().min(0).max(1),
  focusPoints: z.array(focusPointSchema),
  generatedQuestions: z.array(generatedQuestionSchema),
  sessionLinkToken: z.string(),
  sessionStatus: sessionStatusSchema,
  reviewStatus: reviewStatusSchema,
  previewSummary: z.string(),
  previewFlags: z.array(previewFlagSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
});

export const bundleArtifactSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  storagePath: z.string(),
  role: artifactRoleSchema,
  extractedText: z.string(),
  extractedStructure: z.array(extractedSectionSchema).default([]),
  previewMetadata: previewMetadataSchema,
  createdAt: timestampSchema
});

export const sessionSchema = z.object({
  id: z.string(),
  token: z.string(),
  mode: sessionModeSchema,
  questionCount: z.number().int(),
  answerDurationSeconds: z.number().int(),
  allowRerecord: z.boolean(),
  status: sessionStatusSchema,
  startedAt: timestampSchema.nullable(),
  completedAt: timestampSchema.nullable()
});

export const responseSummarySchema = z.object({
  answerSummary: z.string(),
  evidenceQuality: evidenceQualitySchema,
  signals: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  explainability: explainabilitySchema.optional()
});

export const responseSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  audioPath: z.string(),
  videoPath: z.string().nullable(),
  transcriptText: z.string(),
  transcriptConfidence: z.number().min(0).max(1),
  answerSummary: z.string(),
  durationSeconds: z.number().int(),
  summary: responseSummarySchema.optional(),
  createdAt: timestampSchema
});

export const focusPointReviewSchema = z.object({
  focusPointId: z.string(),
  label: z.string(),
  status: focusPointStatusSchema,
  summary: z.string(),
  whyItMatters: z.string(),
  confidence: z.number().min(0).max(1),
  evidenceIds: z.array(z.string()).default([]),
  explainability: explainabilitySchema.optional()
});

export const evidenceCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  finding: z.string(),
  transcriptSnippet: z.string(),
  submissionReference: z.string(),
  whyItMatters: z.string(),
  confidence: z.number().min(0).max(1),
  sourceRefs: z.array(sourceRefSchema),
  explainability: explainabilitySchema
});

export const inconsistencySchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  supportingTranscriptSnippet: z.string(),
  relatedSubmissionReference: z.string(),
  confidence: z.number().min(0).max(1),
  explainability: explainabilitySchema
});

export const perQuestionBreakdownSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  responseSummary: z.string(),
  transcriptSnippet: z.string(),
  linkedFocusPoint: z.string(),
  relatedSubmissionReference: z.string(),
  confidence: z.number().min(0).max(1)
});

export const resultSchema = z.object({
  executiveSummary: z.string(),
  reviewPriority: reviewPrioritySchema,
  recommendedAction: z.string(),
  focusPointStatuses: z.array(focusPointReviewSchema),
  evidenceCards: z.array(evidenceCardSchema),
  inconsistencies: z.array(inconsistencySchema),
  perQuestionBreakdown: z.array(perQuestionBreakdownSchema),
  finalReviewerNote: z.string().default(""),
  reviewedAt: timestampSchema.nullable(),
  reviewedBy: z.string().nullable()
});

export const userPreferencesSchema = z.object({
  theme: z.enum(["dark", "light", "system"]).default("dark"),
  defaultSessionPreferences: sessionDefaultsSchema,
  demoModeHelpers: z.boolean().default(true)
});

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(["reviewer", "admin"]),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  preferences: userPreferencesSchema
});

export const auditEventSchema = z.object({
  id: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  actorId: z.string(),
  action: z.string(),
  metadata: z.record(z.string(), z.any()),
  createdAt: timestampSchema
});

export const settingsSchema = z.object({
  profile: z.object({
    displayName: z.string(),
    email: z.string().email(),
    role: z.string()
  }),
  theme: z.enum(["dark", "light", "system"]),
  defaultSessionPreferences: sessionDefaultsSchema,
  demoModeHelpers: z.boolean()
});

export const dashboardActivitySchema = z.object({
  id: z.string(),
  type: z.enum([
    "imported_submissions",
    "generated_cases",
    "completed_session",
    "reviewed_case"
  ]),
  title: z.string(),
  detail: z.string(),
  assignmentId: z.string().optional(),
  caseId: z.string().optional(),
  createdAt: timestampSchema
});

export const dashboardDataSchema = z.object({
  activeAssignments: z.number().int(),
  pendingReviews: z.number().int(),
  sessionsCompleted: z.number().int(),
  casesWithFlags: z.number().int(),
  recentAssignments: z.array(assignmentSchema),
  pendingCases: z.array(caseSchema),
  recentActivity: z.array(dashboardActivitySchema)
});

export type TimestampValue = z.infer<typeof timestampSchema>;
export type AssignmentFamily = z.infer<typeof assignmentFamilySchema>;
export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;
export type ArtifactRole = z.infer<typeof artifactRoleSchema>;
export type SessionMode = z.infer<typeof sessionModeSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type ReviewPriority = z.infer<typeof reviewPrioritySchema>;
export type SourceRef = z.infer<typeof sourceRefSchema>;
export type Explainability = z.infer<typeof explainabilitySchema>;
export type VerificationGoal = z.infer<typeof verificationGoalSchema>;
export type ExtractedSection = z.infer<typeof extractedSectionSchema>;
export type PreviewMetadata = z.infer<typeof previewMetadataSchema>;
export type Artifact = z.infer<typeof artifactSchema>;
export type AssignmentUnderstanding = z.infer<typeof assignmentUnderstandingSchema>;
export type SessionDefaults = z.infer<typeof sessionDefaultsSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type ImportJob = z.infer<typeof importJobSchema>;
export type ImportItem = z.infer<typeof importItemSchema>;
export type ImportBundle = z.infer<typeof importBundleSchema>;
export type FocusPoint = z.infer<typeof focusPointSchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type Case = z.infer<typeof caseSchema>;
export type BundleArtifact = z.infer<typeof bundleArtifactSchema>;
export type CaseSession = z.infer<typeof sessionSchema>;
export type ResponseSummary = z.infer<typeof responseSummarySchema>;
export type CaseResponse = z.infer<typeof responseSchema>;
export type FocusPointReview = z.infer<typeof focusPointReviewSchema>;
export type EvidenceCard = z.infer<typeof evidenceCardSchema>;
export type Inconsistency = z.infer<typeof inconsistencySchema>;
export type PerQuestionBreakdown = z.infer<typeof perQuestionBreakdownSchema>;
export type CaseResult = z.infer<typeof resultSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type User = z.infer<typeof userSchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type DashboardData = z.infer<typeof dashboardDataSchema>;
