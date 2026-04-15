import enum
import uuid
from datetime import UTC, datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from oralv.db import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class RoleType(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    reviewer = "reviewer"


class AssignmentFamily(str, enum.Enum):
    report = "report"
    presentation = "presentation"
    project = "project"
    technical = "technical"


class CaseStatus(str, enum.Enum):
    draft = "draft"
    ingesting = "ingesting"
    ready_for_review = "ready_for_review"
    published = "published"
    reviewing = "reviewing"
    completed = "completed"
    archived = "archived"


class ArtifactKind(str, enum.Enum):
    assignment = "assignment"
    rubric = "rubric"
    submission = "submission"
    reference = "reference"
    recording = "recording"
    transcript = "transcript"
    export = "export"


class ArtifactStatus(str, enum.Enum):
    uploaded = "uploaded"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class PlanStatus(str, enum.Enum):
    draft = "draft"
    ready = "ready"
    approved = "approved"
    published = "published"


class QuestionKind(str, enum.Enum):
    primary = "primary"
    follow_up = "follow_up"


class SessionStatus(str, enum.Enum):
    invited = "invited"
    active = "active"
    submitted = "submitted"
    processing = "processing"
    completed = "completed"
    expired = "expired"


class ResponseStatus(str, enum.Enum):
    pending = "pending"
    uploaded = "uploaded"
    transcribed = "transcribed"


class EvidenceStatus(str, enum.Enum):
    verified = "verified"
    unresolved = "unresolved"
    inconsistent = "inconsistent"


class CompetencyState(str, enum.Enum):
    verified = "verified"
    developing = "developing"
    unresolved = "unresolved"
    inconsistent = "inconsistent"


class DecisionVerdict(str, enum.Enum):
    verified = "verified"
    requires_follow_up = "requires_follow_up"
    insufficient_evidence = "insufficient_evidence"


class AuditActorType(str, enum.Enum):
    user = "user"
    student = "student"
    system = "system"


class GenerationStage(str, enum.Enum):
    classification = "classification"
    normalization = "normalization"
    claim_extraction = "claim_extraction"
    focus_graph = "focus_graph"
    question_generation = "question_generation"
    follow_up = "follow_up"
    transcription = "transcription"
    evidence_alignment = "evidence_alignment"
    reviewer_summary = "reviewer_summary"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    industry: Mapped[str | None] = mapped_column(String(120))
    onboarding_state: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    memberships: Mapped[list["OrganizationMembership"]] = relationship(back_populates="organization")
    cases: Mapped[list["AssessmentCase"]] = relationship(back_populates="organization")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(512), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    memberships: Mapped[list["OrganizationMembership"]] = relationship(back_populates="user")


class OrganizationMembership(Base, TimestampMixin):
    __tablename__ = "organization_memberships"
    __table_args__ = (UniqueConstraint("organization_id", "user_id", name="uq_org_user"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    role: Mapped[RoleType] = mapped_column(Enum(RoleType), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255))

    organization: Mapped["Organization"] = relationship(back_populates="memberships")
    user: Mapped["User"] = relationship(back_populates="memberships")


class AuthSession(Base, TimestampMixin):
    __tablename__ = "auth_sessions"
    __table_args__ = (
        Index("ix_auth_sessions_org_user", "organization_id", "user_id"),
        Index("ix_auth_sessions_expires", "expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    csrf_token: Mapped[str] = mapped_column(String(128), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ip_address: Mapped[str | None] = mapped_column(String(120))
    user_agent: Mapped[str | None] = mapped_column(String(512))


class InviteToken(Base, TimestampMixin):
    __tablename__ = "invite_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    invited_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role: Mapped[RoleType] = mapped_column(Enum(RoleType), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    redeemed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AssessmentTemplate(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "assessment_templates"
    __table_args__ = (Index("ix_templates_org_family", "organization_id", "assignment_family"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    assignment_family: Mapped[AssignmentFamily] = mapped_column(Enum(AssignmentFamily), nullable=False)
    config_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    plan_snapshot_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)


class AssessmentCase(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "assessment_cases"
    __table_args__ = (
        Index("ix_cases_org_status", "organization_id", "status"),
        Index("ix_cases_org_family", "organization_id", "assignment_family"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    template_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_templates.id"), nullable=True
    )
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    course_name: Mapped[str | None] = mapped_column(String(255))
    assignment_family: Mapped[AssignmentFamily] = mapped_column(Enum(AssignmentFamily), nullable=False)
    status: Mapped[CaseStatus] = mapped_column(Enum(CaseStatus), default=CaseStatus.draft, index=True)
    tags_json: Mapped[list[str]] = mapped_column(JSON, default=list)
    publication_state_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    organization: Mapped["Organization"] = relationship(back_populates="cases")


class SubmissionRecord(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "submission_records"
    __table_args__ = (
        Index("ix_submissions_case_status", "case_id", "status"),
        Index("ix_submissions_org_student", "organization_id", "student_email"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_cases.id"), nullable=False, index=True
    )
    student_name: Mapped[str] = mapped_column(String(255), nullable=False)
    student_email: Mapped[str] = mapped_column(String(255), nullable=False)
    external_identifier: Mapped[str | None] = mapped_column(String(255), index=True)
    status: Mapped[str] = mapped_column(String(50), default="queued", index=True)
    queue_position: Mapped[int | None] = mapped_column(Integer)
    artifact_bundle_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class Artifact(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "artifacts"
    __table_args__ = (
        Index("ix_artifacts_case_kind", "case_id", "kind"),
        Index("ix_artifacts_submission_kind", "submission_record_id", "kind"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_cases.id"), nullable=False, index=True
    )
    submission_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submission_records.id"), nullable=True, index=True
    )
    kind: Mapped[ArtifactKind] = mapped_column(Enum(ArtifactKind), nullable=False)
    status: Mapped[ArtifactStatus] = mapped_column(Enum(ArtifactStatus), default=ArtifactStatus.uploaded)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(120), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    byte_size: Mapped[int] = mapped_column(Integer, default=0)
    version_number: Mapped[int] = mapped_column(Integer, default=1)
    page_count: Mapped[int | None] = mapped_column(Integer)
    source_label: Mapped[str | None] = mapped_column(String(255))
    classification_confidence: Mapped[float | None] = mapped_column(Float)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class ParsedArtifact(Base, TimestampMixin):
    __tablename__ = "parsed_artifacts"
    __table_args__ = (Index("ix_parsed_artifacts_artifact", "artifact_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_cases.id"), nullable=False, index=True
    )
    artifact_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("artifacts.id"), nullable=False, unique=True
    )
    submission_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submission_records.id"), nullable=True
    )
    normalized_text: Mapped[str] = mapped_column(Text, default="")
    normalized_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    section_count: Mapped[int] = mapped_column(Integer, default=0)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    parsing_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    low_text_confidence: Mapped[bool] = mapped_column(Boolean, default=False)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(64))


class DefensePlan(Base, TimestampMixin):
    __tablename__ = "defense_plans"
    __table_args__ = (
        UniqueConstraint("submission_record_id", "version_number", name="uq_plan_submission_version"),
        Index("ix_plans_case_status", "case_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_cases.id"), nullable=False, index=True
    )
    submission_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submission_records.id"), nullable=False, index=True
    )
    status: Mapped[PlanStatus] = mapped_column(Enum(PlanStatus), default=PlanStatus.draft)
    version_number: Mapped[int] = mapped_column(Integer, default=1)
    focus_graph_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    plan_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    settings_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    reviewer_notes: Mapped[str | None] = mapped_column(Text)


class DefenseQuestion(Base, TimestampMixin):
    __tablename__ = "defense_questions"
    __table_args__ = (
        Index("ix_questions_plan_sequence", "defense_plan_id", "sequence"),
        Index("ix_questions_parent", "parent_question_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    defense_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defense_plans.id"), nullable=False, index=True
    )
    parent_question_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defense_questions.id"), nullable=True
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    evaluation_target: Mapped[str] = mapped_column(String(255), nullable=False)
    expected_signal: Mapped[str | None] = mapped_column(Text)
    question_kind: Mapped[QuestionKind] = mapped_column(Enum(QuestionKind), default=QuestionKind.primary)
    prep_seconds: Mapped[int] = mapped_column(Integer, default=30)
    response_seconds: Mapped[int] = mapped_column(Integer, default=120)
    branch_condition_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(64))


class DefenseSession(Base, TimestampMixin):
    __tablename__ = "defense_sessions"
    __table_args__ = (
        Index("ix_sessions_case_status", "case_id", "status"),
        Index("ix_sessions_submission_status", "submission_record_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_cases.id"), nullable=False, index=True
    )
    submission_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submission_records.id"), nullable=False, index=True
    )
    defense_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defense_plans.id"), nullable=False, index=True
    )
    public_token: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    access_token_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.invited)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completion_percent: Mapped[float] = mapped_column(Float, default=0.0)
    settings_snapshot_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class ResponseSegment(Base, TimestampMixin):
    __tablename__ = "response_segments"
    __table_args__ = (Index("ix_response_segments_session_question", "defense_session_id", "defense_question_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    defense_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defense_sessions.id"), nullable=False, index=True
    )
    defense_question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defense_questions.id"), nullable=False, index=True
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[ResponseStatus] = mapped_column(Enum(ResponseStatus), default=ResponseStatus.pending)
    artifact_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("artifacts.id"))
    transcript_text: Mapped[str | None] = mapped_column(Text)
    response_duration_seconds: Mapped[int | None] = mapped_column(Integer)
    prep_duration_seconds: Mapped[int | None] = mapped_column(Integer)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    confidence: Mapped[float | None] = mapped_column(Float)


class TranscriptSegment(Base, TimestampMixin):
    __tablename__ = "transcript_segments"
    __table_args__ = (Index("ix_transcript_session_response", "defense_session_id", "response_segment_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    defense_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defense_sessions.id"), nullable=False, index=True
    )
    response_segment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("response_segments.id"), nullable=False
    )
    start_ms: Mapped[int] = mapped_column(Integer, default=0)
    end_ms: Mapped[int] = mapped_column(Integer, default=0)
    speaker_label: Mapped[str] = mapped_column(String(50), default="student")
    text: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(64))


class EvidenceItem(Base, TimestampMixin):
    __tablename__ = "evidence_items"
    __table_args__ = (
        Index("ix_evidence_submission_status", "submission_record_id", "status"),
        Index("ix_evidence_competency", "submission_record_id", "competency_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_cases.id"), nullable=False, index=True
    )
    submission_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submission_records.id"), nullable=False, index=True
    )
    defense_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defense_sessions.id"), nullable=False, index=True
    )
    defense_question_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defense_questions.id")
    )
    competency_key: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[EvidenceStatus] = mapped_column(Enum(EvidenceStatus), nullable=False)
    evidence_snippet: Mapped[str] = mapped_column(Text, nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    related_claim: Mapped[str | None] = mapped_column(Text)
    source_segment_ids_json: Mapped[list[str]] = mapped_column(JSON, default=list)


class CompetencyStatus(Base, TimestampMixin):
    __tablename__ = "competency_statuses"
    __table_args__ = (
        UniqueConstraint("submission_record_id", "competency_key", name="uq_submission_competency"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_cases.id"), nullable=False, index=True
    )
    submission_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submission_records.id"), nullable=False, index=True
    )
    competency_key: Mapped[str] = mapped_column(String(255), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[CompetencyState] = mapped_column(Enum(CompetencyState), nullable=False)
    score: Mapped[float] = mapped_column(Numeric(4, 2), default=0.0)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    supporting_evidence_ids_json: Mapped[list[str]] = mapped_column(JSON, default=list)


class ReviewDecision(Base, TimestampMixin):
    __tablename__ = "review_decisions"
    __table_args__ = (UniqueConstraint("submission_record_id", name="uq_decision_submission"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_cases.id"), nullable=False, index=True
    )
    submission_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submission_records.id"), nullable=False, index=True
    )
    decided_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    verdict: Mapped[DecisionVerdict] = mapped_column(Enum(DecisionVerdict), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    reviewer_note: Mapped[str | None] = mapped_column(Text)
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    confidence_band: Mapped[str | None] = mapped_column(String(50))


class AuditEvent(Base, TimestampMixin):
    __tablename__ = "audit_events"
    __table_args__ = (
        Index("ix_audit_case_created", "case_id", "created_at"),
        Index("ix_audit_submission_created", "submission_record_id", "created_at"),
        Index("ix_audit_session_created", "defense_session_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_cases.id"), nullable=True
    )
    submission_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submission_records.id"), nullable=True
    )
    defense_session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defense_sessions.id"), nullable=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    actor_type: Mapped[AuditActorType] = mapped_column(Enum(AuditActorType), nullable=False)
    event_type: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(120), nullable=False)
    payload_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class GenerationTrace(Base, TimestampMixin):
    __tablename__ = "generation_traces"
    __table_args__ = (
        Index("ix_generation_submission_stage", "submission_record_id", "stage"),
        Index("ix_generation_session_stage", "defense_session_id", "stage"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_cases.id"), nullable=True
    )
    submission_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submission_records.id"), nullable=True
    )
    defense_session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defense_sessions.id"), nullable=True
    )
    stage: Mapped[GenerationStage] = mapped_column(Enum(GenerationStage), nullable=False)
    provider: Mapped[str] = mapped_column(String(120), nullable=False)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False)
    prompt_name: Mapped[str] = mapped_column(String(255), nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(50), nullable=False)
    input_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    seed: Mapped[str] = mapped_column(String(64), nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    output_entity_type: Mapped[str] = mapped_column(String(120), nullable=False)
    output_entity_id: Mapped[str] = mapped_column(String(120), nullable=False)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
