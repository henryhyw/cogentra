from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.models.domain import (
    Artifact,
    Assignment,
    AssignmentUnderstanding,
    Case,
    CaseResponse,
    Explainability,
    FocusPoint,
    GeneratedQuestion,
    Result,
    SourceRef,
)


@dataclass
class ArtifactClassificationResult:
    role: str
    confidence: float
    reasoning: str
    signals: list[str]

    def as_explainability(self) -> Explainability:
        return Explainability(
            why=self.reasoning,
            referenced_sources=[],
            model_confidence=self.confidence,
            signals=self.signals,
        )


@dataclass
class BundleGroupingResult:
    bundles: list[dict]
    unresolved_items: list[dict]
    explainability: Explainability


class AIProvider(ABC):
    @abstractmethod
    def classify_artifact(self, *, file_name: str, mime_type: str, text_preview: str, is_student: bool) -> ArtifactClassificationResult:
        raise NotImplementedError

    @abstractmethod
    def understand_assignment(self, assignment: Assignment, artifacts: list[Artifact]) -> AssignmentUnderstanding:
        raise NotImplementedError

    @abstractmethod
    def group_student_bundles(
        self,
        *,
        assignment: Assignment,
        artifacts: list[Artifact],
        roster_text: str | None,
    ) -> BundleGroupingResult:
        raise NotImplementedError

    @abstractmethod
    def extract_focus_points(
        self,
        *,
        assignment: Assignment,
        case: Case,
        bundle_artifacts: list[Artifact],
    ) -> tuple[str, list[FocusPoint], list[dict]]:
        raise NotImplementedError

    @abstractmethod
    def generate_questions(
        self,
        *,
        assignment: Assignment,
        case: Case,
        focus_points: list[FocusPoint],
    ) -> list[GeneratedQuestion]:
        raise NotImplementedError

    @abstractmethod
    def summarize_response(
        self,
        *,
        assignment: Assignment,
        case: Case,
        question: GeneratedQuestion,
        response: CaseResponse,
        related_sources: list[SourceRef],
    ) -> CaseResponse:
        raise NotImplementedError

    @abstractmethod
    def synthesize_result(
        self,
        *,
        assignment: Assignment,
        case: Case,
        responses: list[CaseResponse],
        focus_points: list[FocusPoint],
        questions: list[GeneratedQuestion],
    ) -> Result:
        raise NotImplementedError
