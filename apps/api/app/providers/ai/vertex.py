from __future__ import annotations

import json
from textwrap import dedent

from app.config import Settings
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
from app.providers.ai.base import AIProvider, ArtifactClassificationResult, BundleGroupingResult
from app.providers.ai.demo import DemoAIProvider


class VertexAIProvider(AIProvider):
    def __init__(self, settings: Settings):
        self.settings = settings
        self._fallback = DemoAIProvider()
        try:
            import vertexai
            from vertexai.generative_models import GenerationConfig, GenerativeModel
        except Exception:  # pragma: no cover
            self._model = None
            self._generation_config = None
        else:
            if settings.vertex_project_id:
                vertexai.init(project=settings.vertex_project_id, location=settings.vertex_location)
                self._model = GenerativeModel(settings.vertex_model_text)
                self._generation_config = GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            else:
                self._model = None
                self._generation_config = None

    def classify_artifact(self, *, file_name: str, mime_type: str, text_preview: str, is_student: bool) -> ArtifactClassificationResult:
        if not self._model:
            return self._fallback.classify_artifact(
                file_name=file_name,
                mime_type=mime_type,
                text_preview=text_preview,
                is_student=is_student,
            )
        prompt = dedent(
            f"""
            You are classifying a single uploaded file for Concentra.
            Return strict JSON with keys: role, confidence, reasoning, signals.
            Allowed roles:
            assignment_brief, rubric, teacher_note, model_answer, support_material,
            primary_submission, support_submission, visual_submission, technical_submission.
            Student file: {is_student}
            File name: {file_name}
            MIME type: {mime_type}
            Preview:
            {text_preview[:2000]}
            """
        )
        payload = self._generate_json(prompt)
        return ArtifactClassificationResult(
            role=payload["role"],
            confidence=float(payload["confidence"]),
            reasoning=payload["reasoning"],
            signals=list(payload.get("signals", [])),
        )

    def understand_assignment(self, assignment: Assignment, artifacts: list[Artifact]) -> AssignmentUnderstanding:
        if not self._model or not artifacts:
            return self._fallback.understand_assignment(assignment, artifacts)
        prompt = dedent(
            f"""
            You are building assignment understanding for Concentra.
            Assignment title: {assignment.title}
            Assignment family hint: {assignment.family}
            Return strict JSON with:
            assignment_summary, assignment_family, verification_goals, expected_submission_characteristics,
            defensible_areas, verification_dimensions, preferred_question_types, avoid_question_types,
            reviewer_focus_advice, explainability.
            Artifact excerpts:
            {json.dumps([{"fileName": artifact.file_name, "role": artifact.role, "text": artifact.extracted_text[:1200]} for artifact in artifacts], indent=2)}
            """
        )
        payload = self._generate_json(prompt)
        return AssignmentUnderstanding.model_validate(payload)

    def group_student_bundles(self, *, assignment: Assignment, artifacts: list[Artifact], roster_text: str | None) -> BundleGroupingResult:
        if not self._model:
            return self._fallback.group_student_bundles(assignment=assignment, artifacts=artifacts, roster_text=roster_text)
        prompt = dedent(
            f"""
            Group these imported student files into per-student bundles for Concentra.
            Return strict JSON with keys bundles, unresolved_items, explainability.
            Assignment family: {assignment.family}
            Roster text: {roster_text or ""}
            Files:
            {json.dumps([{"id": artifact.id, "fileName": artifact.file_name, "preview": artifact.extracted_text[:400]} for artifact in artifacts], indent=2)}
            """
        )
        payload = self._generate_json(prompt)
        return BundleGroupingResult(
            bundles=payload["bundles"],
            unresolved_items=payload.get("unresolved_items", []),
            explainability=Explainability.model_validate(payload["explainability"]),
        )

    def extract_focus_points(self, *, assignment: Assignment, case: Case, bundle_artifacts: list[Artifact]) -> tuple[str, list[FocusPoint], list[dict]]:
        if not self._model:
            return self._fallback.extract_focus_points(assignment=assignment, case=case, bundle_artifacts=bundle_artifacts)
        prompt = dedent(
            f"""
            Extract oral verification focus points for a student submission in Concentra.
            Return strict JSON with submission_summary, focus_points, potential_concerns.
            Assignment understanding:
            {assignment.assignment_understanding.model_dump(by_alias=True)}
            Student submission excerpts:
            {json.dumps([{"fileName": artifact.file_name, "role": artifact.role, "sections": [section.model_dump(by_alias=True) for section in artifact.extracted_structure[:6]]} for artifact in bundle_artifacts], indent=2)}
            """
        )
        payload = self._generate_json(prompt)
        return payload["submission_summary"], [FocusPoint.model_validate(item) for item in payload["focus_points"]], payload.get("potential_concerns", [])

    def generate_questions(self, *, assignment: Assignment, case: Case, focus_points: list[FocusPoint]) -> list[GeneratedQuestion]:
        if not self._model:
            return self._fallback.generate_questions(assignment=assignment, case=case, focus_points=focus_points)
        prompt = dedent(
            f"""
            Generate concise oral verification questions for Concentra.
            Return strict JSON with key questions.
            Question count: {assignment.session_defaults.question_count}
            Focus points:
            {json.dumps([item.model_dump(by_alias=True) for item in focus_points], indent=2)}
            """
        )
        payload = self._generate_json(prompt)
        return [GeneratedQuestion.model_validate(item) for item in payload["questions"]]

    def summarize_response(self, *, assignment: Assignment, case: Case, question: GeneratedQuestion, response: CaseResponse, related_sources: list[SourceRef]) -> CaseResponse:
        if not self._model:
            return self._fallback.summarize_response(
                assignment=assignment,
                case=case,
                question=question,
                response=response,
                related_sources=related_sources,
            )
        prompt = dedent(
            f"""
            Summarize a student oral response for Concentra.
            Return strict JSON with answer_summary, evidence_quality, signals, confidence, explainability.
            Question:
            {question.model_dump(by_alias=True)}
            Transcript:
            {response.transcript_text}
            Source refs:
            {json.dumps([ref.model_dump(by_alias=True) for ref in related_sources], indent=2)}
            """
        )
        payload = self._generate_json(prompt)
        response.answer_summary = payload["answer_summary"]
        response.summary = payload
        return response

    def synthesize_result(self, *, assignment: Assignment, case: Case, responses: list[CaseResponse], focus_points: list[FocusPoint], questions: list[GeneratedQuestion]) -> Result:
        if not self._model:
            return self._fallback.synthesize_result(
                assignment=assignment,
                case=case,
                responses=responses,
                focus_points=focus_points,
                questions=questions,
            )
        prompt = dedent(
            f"""
            Produce a reviewer-facing Concentra result package.
            Return strict JSON matching:
            executive_summary, review_priority, recommended_action, focus_point_statuses,
            evidence_cards, inconsistencies, per_question_breakdown, final_reviewer_note, reviewed_at, reviewed_by.
            Assignment understanding:
            {assignment.assignment_understanding.model_dump(by_alias=True)}
            Focus points:
            {json.dumps([item.model_dump(by_alias=True) for item in focus_points], indent=2)}
            Questions:
            {json.dumps([item.model_dump(by_alias=True) for item in questions], indent=2)}
            Responses:
            {json.dumps([item.model_dump(by_alias=True) for item in responses], indent=2)}
            """
        )
        payload = self._generate_json(prompt)
        return Result.model_validate(payload)

    def _generate_json(self, prompt: str) -> dict:
        if not self._model:
            raise RuntimeError("Vertex AI model is not configured")
        try:
            response = self._model.generate_content(prompt, generation_config=self._generation_config)
            text = response.text or "{}"
            return json.loads(text)
        except Exception:
            return {}
