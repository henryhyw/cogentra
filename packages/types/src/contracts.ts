export type AssignmentFamily = "report" | "presentation" | "project" | "technical";
export type ArtifactKind =
  | "assignment"
  | "rubric"
  | "submission"
  | "reference"
  | "recording"
  | "transcript"
  | "export";
export type ArtifactStatus = "uploaded" | "processing" | "ready" | "failed";
export type CaseStatus =
  | "draft"
  | "ingesting"
  | "ready_for_review"
  | "published"
  | "reviewing"
  | "completed"
  | "archived";
export type PlanStatus = "draft" | "ready" | "approved" | "published";
export type SessionStatus = "invited" | "active" | "submitted" | "processing" | "completed" | "expired";
export type EvidenceStatus = "verified" | "unresolved" | "inconsistent";
export type CompetencyState = "verified" | "developing" | "unresolved" | "inconsistent";
export type DecisionVerdict = "verified" | "requires_follow_up" | "insufficient_evidence";
export type RoleType = "owner" | "admin" | "reviewer";

export interface UserSummary {
  id: string;
  email: string;
  full_name: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  description?: string | null;
  course_name?: string | null;
  assignment_family: AssignmentFamily;
  status: CaseStatus;
  created_at: string;
}

export interface ArtifactSummary {
  id: string;
  kind: ArtifactKind;
  status: ArtifactStatus;
  filename: string;
  content_type: string;
  source_label?: string | null;
  classification_confidence?: number | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface SubmissionSummary {
  id: string;
  student_name: string;
  student_email: string;
  status: string;
  external_identifier?: string | null;
  queue_position?: number | null;
}

export interface DefenseQuestion {
  id: string;
  sequence: number;
  prompt: string;
  rationale: string;
  evaluation_target: string;
  expected_signal?: string | null;
  prep_seconds: number;
  response_seconds: number;
  question_kind: "primary" | "follow_up";
  branch_condition_json: Record<string, unknown>;
}

export interface DefensePlan {
  id: string;
  status: PlanStatus;
  version_number: number;
  focus_graph_json: Record<string, unknown>;
  plan_json: Record<string, unknown>;
  settings_json: Record<string, unknown>;
  reviewer_notes?: string | null;
}

export interface CompetencySummary {
  id: string;
  competency_key: string;
  label: string;
  status: CompetencyState;
  score: number;
  summary: string;
}

export interface EvidenceSummary {
  id: string;
  competency_key: string;
  title: string;
  status: EvidenceStatus;
  evidence_snippet: string;
  rationale: string;
  confidence: number;
}

export interface DecisionSummary {
  id: string;
  verdict: DecisionVerdict;
  summary: string;
  reviewer_note?: string | null;
  confidence_band?: string | null;
}
