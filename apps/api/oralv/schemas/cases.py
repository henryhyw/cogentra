from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from oralv.models import ArtifactKind, AssignmentFamily


class CreateCaseRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str | None = None
    course_name: str | None = None
    assignment_family: AssignmentFamily
    template_id: UUID | None = None


class ReclassifyArtifactRequest(BaseModel):
    kind: ArtifactKind


class UpdatePlanRequest(BaseModel):
    focus_graph_json: dict[str, Any]
    plan_json: dict[str, Any]
    settings_json: dict[str, Any]
    reviewer_notes: str | None = None
    questions: list[dict[str, Any]]


class CreateTemplateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
