from __future__ import annotations

from pydantic import Field

from app.models.domain import CamelModel, SessionDefaults


class AuthResponse(CamelModel):
    token: str
    user_id: str
    email: str
    display_name: str
    role: str
    mode: str


class DemoLoginRequest(CamelModel):
    email: str | None = None


class CreateAssignmentRequest(CamelModel):
    title: str
    family: str
    description: str = ""


class UpdateAssignmentRequest(CamelModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    verification_goals: list[dict] | None = None
    session_defaults: SessionDefaults | None = None


class UploadUrlRequest(CamelModel):
    file_name: str
    mime_type: str
    content_length: int = Field(default=0)


class UploadUrlResponse(CamelModel):
    upload_id: str
    upload_url: str
    storage_path: str
    headers: dict[str, str] = Field(default_factory=dict)


class RegisterArtifactRequest(CamelModel):
    file_name: str
    storage_path: str
    mime_type: str
    original_size: int


class AnalyzeArtifactsRequest(CamelModel):
    artifact_ids: list[str] | None = None


class RegisterImportBatchRequest(CamelModel):
    items: list[RegisterArtifactRequest]
    source_type: str = "mixed"
    roster_csv_path: str | None = None


class FixMappingRequest(CamelModel):
    import_item_id: str
    matched_student_identifier: str
    bundle_id: str | None = None


class ReviewNoteRequest(CamelModel):
    final_reviewer_note: str


class SessionStartRequest(CamelModel):
    started: bool = True


class SubmitResponseRequest(CamelModel):
    question_id: str
    audio_path: str
    video_path: str | None = None
    duration_seconds: int


class UpdateSettingsRequest(CamelModel):
    theme: str | None = None
    default_session_preferences: SessionDefaults | None = None
    demo_mode_helpers: bool | None = None
