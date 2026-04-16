from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.title() for part in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
        use_enum_values=True,
        arbitrary_types_allowed=True,
    )


class AssignmentFamily(str, Enum):
    REPORT_ESSAY = "report_essay"
    PRESENTATION_SLIDES = "presentation_slides"
    TECHNICAL_NOTEBOOK = "technical_notebook"
    MIXED_SUBMISSION = "mixed_submission"


class AssignmentStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PROCESSING = "processing"
    READY = "ready"
    ARCHIVED = "archived"


class ArtifactRole(str, Enum):
    ASSIGNMENT_BRIEF = "assignment_brief"
    RUBRIC = "rubric"
    TEACHER_NOTE = "teacher_note"
    MODEL_ANSWER = "model_answer"
    SUPPORT_MATERIAL = "support_material"
    PRIMARY_SUBMISSION = "primary_submission"
    SUPPORT_SUBMISSION = "support_submission"
    VISUAL_SUBMISSION = "visual_submission"
    TECHNICAL_SUBMISSION = "technical_submission"


class SessionMode(str, Enum):
    AUDIO_ONLY = "audio_only"
    AUDIO_VIDEO = "audio_video"


class SessionStatus(str, Enum):
    NOT_SENT = "not_sent"
    SENT = "sent"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    TRANSCRIPT_READY = "transcript_ready"
    SUMMARY_READY = "summary_ready"


class ReviewStatus(str, Enum):
    NOT_STARTED = "not_started"
    NEEDS_REVIEW = "needs_review"
    REVIEWED = "reviewed"


class ReviewPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class FocusPointState(str, Enum):
    VERIFIED = "verified"
    PARTIALLY_VERIFIED = "partially_verified"
    UNCLEAR = "unclear"
    NEEDS_FOLLOW_UP = "needs_follow_up"


class EvidenceQuality(str, Enum):
    STRONG = "strong"
    MEDIUM = "medium"
    WEAK = "weak"


class SourceKind(str, Enum):
    ASSIGNMENT = "assignment"
    RUBRIC = "rubric"
    SUBMISSION = "submission"
    TRANSCRIPT = "transcript"
    RESPONSE = "response"


class SourceRef(CamelModel):
    artifact_id: str | None = None
    label: str
    section_title: str | None = None
    locator: str | None = None
    excerpt: str | None = None
    kind: SourceKind
    score: float | None = None


class Explainability(CamelModel):
    why: str
    referenced_sources: list[SourceRef] = Field(default_factory=list)
    model_confidence: float
    signals: list[str] = Field(default_factory=list)


class VerificationGoal(CamelModel):
    id: str
    label: str
    description: str
    enabled: bool = True
    order: int = 0
    confidence: float
    explainability: Explainability | None = None


class ExtractedSection(CamelModel):
    id: str
    title: str
    body: str
    order: int
    tags: list[str] = Field(default_factory=list)


class PreviewMetadata(CamelModel):
    kind: str
    summary: str
    page_count: int | None = None
    slide_count: int | None = None
    thumbnails: list[str] = Field(default_factory=list)
    highlighted_sections: list[str] = Field(default_factory=list)


class Artifact(CamelModel):
    id: str
    file_name: str
    storage_path: str
    mime_type: str
    original_size: int
    role: ArtifactRole
    detected_role: ArtifactRole
    role_confidence: float
    extracted_text: str
    extracted_structure: list[ExtractedSection] = Field(default_factory=list)
    preview_metadata: PreviewMetadata
    created_at: str
    explainability: Explainability | None = None


class AssignmentUnderstanding(CamelModel):
    assignment_summary: str
    assignment_family: AssignmentFamily
    verification_goals: list[VerificationGoal]
    expected_submission_characteristics: list[str]
    defensible_areas: list[str]
    verification_dimensions: list[str]
    preferred_question_types: list[str]
    avoid_question_types: list[str]
    reviewer_focus_advice: list[str]
    explainability: Explainability


class SessionDefaults(CamelModel):
    question_count: int
    answer_duration_seconds: int
    allow_rerecord: bool
    response_mode: SessionMode


class Assignment(CamelModel):
    id: str
    title: str
    family: AssignmentFamily
    description: str = ""
    status: AssignmentStatus
    created_by: str
    created_at: str
    updated_at: str
    session_defaults: SessionDefaults
    verification_goals: list[VerificationGoal]
    ai_summary: str
    ai_summary_confidence: float
    assignment_understanding: AssignmentUnderstanding
    artifact_count: int
    case_count: int
    completed_session_count: int
    pending_review_count: int


class ImportStatus(str, Enum):
    DRAFT = "draft"
    UPLOADING = "uploading"
    ANALYZING = "analyzing"
    READY = "ready"
    BLOCKED = "blocked"
    COMPLETED = "completed"


class ImportItem(CamelModel):
    id: str
    file_name: str
    storage_path: str
    detected_student_identifier: str | None = None
    matched_student_identifier: str | None = None
    detected_role: ArtifactRole
    confidence: float
    bundle_id: str | None = None
    unresolved_reason: str | None = None
    created_at: str


class ImportBundle(CamelModel):
    bundle_id: str
    student_identifier: str
    student_name: str | None = None
    student_email: str | None = None
    file_count: int
    submission_family: AssignmentFamily
    confidence: float
    unresolved: bool = False


class ImportJob(CamelModel):
    id: str
    created_at: str
    created_by: str
    status: ImportStatus
    source_type: str
    roster_csv_path: str | None = None
    files_count: int
    detected_students_count: int
    unresolved_items_count: int
    stage_labels: list[str] = Field(default_factory=list)
    imported_artifacts: list[ImportItem] = Field(default_factory=list)
    detected_bundles: list[ImportBundle] = Field(default_factory=list)


class FocusPoint(CamelModel):
    id: str
    label: str
    description: str
    why_it_matters: str
    related_goals: list[str]
    source_refs: list[SourceRef]
    confidence: float
    explainability: Explainability


class GeneratedQuestion(CamelModel):
    id: str
    order: int
    text: str
    focus_label: str
    focus_point_id: str
    rationale: str
    expected_evidence: str
    source_refs: list[SourceRef]
    confidence: float
    explainability: Explainability


class PreviewFlag(CamelModel):
    id: str
    tone: str
    label: str
    detail: str
    confidence: float


class Case(CamelModel):
    id: str
    assignment_id: str
    student_identifier: str
    student_name: str | None = None
    student_email: str | None = None
    submission_family: AssignmentFamily
    bundle_artifact_ids: list[str]
    ai_confidence: float
    focus_points: list[FocusPoint]
    generated_questions: list[GeneratedQuestion]
    session_link_token: str
    session_status: SessionStatus
    review_status: ReviewStatus
    preview_summary: str
    preview_flags: list[PreviewFlag] = Field(default_factory=list)
    created_at: str
    updated_at: str


class BundleArtifact(CamelModel):
    id: str
    file_name: str
    storage_path: str
    role: ArtifactRole
    extracted_text: str
    extracted_structure: list[ExtractedSection]
    preview_metadata: PreviewMetadata
    created_at: str


class CaseSession(CamelModel):
    id: str
    token: str
    mode: SessionMode
    question_count: int
    answer_duration_seconds: int
    allow_rerecord: bool
    status: SessionStatus
    started_at: str | None = None
    completed_at: str | None = None


class ResponseSummary(CamelModel):
    answer_summary: str
    evidence_quality: EvidenceQuality
    signals: list[str]
    confidence: float
    explainability: Explainability | None = None


class CaseResponse(CamelModel):
    id: str
    question_id: str
    audio_path: str
    video_path: str | None = None
    transcript_text: str
    transcript_confidence: float
    answer_summary: str
    duration_seconds: int
    summary: ResponseSummary | None = None
    created_at: str


class FocusPointReview(CamelModel):
    focus_point_id: str
    label: str
    status: FocusPointState
    summary: str
    why_it_matters: str
    confidence: float
    evidence_ids: list[str] = Field(default_factory=list)
    explainability: Explainability | None = None


class EvidenceCard(CamelModel):
    id: str
    title: str
    finding: str
    transcript_snippet: str
    submission_reference: str
    why_it_matters: str
    confidence: float
    source_refs: list[SourceRef]
    explainability: Explainability


class Inconsistency(CamelModel):
    id: str
    type: str
    description: str
    supporting_transcript_snippet: str
    related_submission_reference: str
    confidence: float
    explainability: Explainability


class PerQuestionBreakdown(CamelModel):
    question_id: str
    question_text: str
    response_summary: str
    transcript_snippet: str
    linked_focus_point: str
    related_submission_reference: str
    confidence: float


class Result(CamelModel):
    executive_summary: str
    review_priority: ReviewPriority
    recommended_action: str
    focus_point_statuses: list[FocusPointReview]
    evidence_cards: list[EvidenceCard]
    inconsistencies: list[Inconsistency]
    per_question_breakdown: list[PerQuestionBreakdown]
    final_reviewer_note: str = ""
    reviewed_at: str | None = None
    reviewed_by: str | None = None


class UserPreferences(CamelModel):
    theme: str = "dark"
    default_session_preferences: SessionDefaults
    demo_mode_helpers: bool = True


class User(CamelModel):
    id: str
    email: str
    display_name: str
    role: str
    created_at: str
    updated_at: str
    preferences: UserPreferences


class AuditEvent(CamelModel):
    id: str
    entity_type: str
    entity_id: str
    actor_id: str
    action: str
    metadata: dict[str, Any]
    created_at: str


class DashboardActivity(CamelModel):
    id: str
    type: str
    title: str
    detail: str
    assignment_id: str | None = None
    case_id: str | None = None
    created_at: str


class DashboardData(CamelModel):
    active_assignments: int
    pending_reviews: int
    sessions_completed: int
    cases_with_flags: int
    recent_assignments: list[Assignment]
    pending_cases: list[Case]
    recent_activity: list[DashboardActivity]


class SettingsPayload(CamelModel):
    profile: dict[str, str]
    theme: str
    default_session_preferences: SessionDefaults
    demo_mode_helpers: bool


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
