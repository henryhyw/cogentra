from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from oralv.models import (
    ArtifactKind,
    ArtifactStatus,
    AssignmentFamily,
    CaseStatus,
    CompetencyState,
    DecisionVerdict,
    EvidenceStatus,
    PlanStatus,
    QuestionKind,
    ResponseStatus,
    RoleType,
    SessionStatus,
)


class CamelModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ApiMessage(CamelModel):
    message: str


class ApiEnvelope(CamelModel):
    data: Any


class UserSummary(CamelModel):
    id: UUID
    email: str
    full_name: str


class OrganizationSummary(CamelModel):
    id: UUID
    name: str
    slug: str


class MembershipSummary(CamelModel):
    id: UUID
    role: RoleType
    title: str | None = None
    organization: OrganizationSummary
    user: UserSummary


class ArtifactSummary(CamelModel):
    id: UUID
    kind: ArtifactKind
    status: ArtifactStatus
    filename: str
    content_type: str
    source_label: str | None = None
    classification_confidence: float | None = None
    metadata_json: dict[str, Any]
    created_at: datetime


class ParsedArtifactSummary(CamelModel):
    id: UUID
    artifact_id: UUID
    normalized_text: str
    normalized_json: dict[str, Any]
    section_count: int
    word_count: int
    parsing_confidence: float
    low_text_confidence: bool


class SubmissionSummary(CamelModel):
    id: UUID
    student_name: str
    student_email: str
    external_identifier: str | None = None
    status: str
    queue_position: int | None = None


class CaseSummary(CamelModel):
    id: UUID
    title: str
    description: str | None = None
    course_name: str | None = None
    assignment_family: AssignmentFamily
    status: CaseStatus
    created_at: datetime


class QuestionSummary(CamelModel):
    id: UUID
    sequence: int
    prompt: str
    rationale: str
    evaluation_target: str
    expected_signal: str | None = None
    question_kind: QuestionKind
    prep_seconds: int
    response_seconds: int
    branch_condition_json: dict[str, Any]
    is_active: bool


class PlanSummary(CamelModel):
    id: UUID
    status: PlanStatus
    version_number: int
    focus_graph_json: dict[str, Any]
    plan_json: dict[str, Any]
    settings_json: dict[str, Any]
    reviewer_notes: str | None = None
    questions: list[QuestionSummary]


class SessionSummary(CamelModel):
    id: UUID
    public_token: str
    status: SessionStatus
    expires_at: datetime | None = None
    started_at: datetime | None = None
    submitted_at: datetime | None = None
    completed_at: datetime | None = None
    completion_percent: float


class ResponseSummary(CamelModel):
    id: UUID
    defense_question_id: UUID
    sequence: int
    status: ResponseStatus
    transcript_text: str | None = None
    response_duration_seconds: int | None = None
    prep_duration_seconds: int | None = None


class EvidenceSummary(CamelModel):
    id: UUID
    competency_key: str
    title: str
    status: EvidenceStatus
    evidence_snippet: str
    rationale: str
    confidence: float


class CompetencySummary(CamelModel):
    id: UUID
    competency_key: str
    label: str
    status: CompetencyState
    score: float
    summary: str


class DecisionSummary(CamelModel):
    id: UUID
    verdict: DecisionVerdict
    summary: str
    reviewer_note: str | None = None
    confidence_band: str | None = None
