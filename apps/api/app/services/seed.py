from __future__ import annotations

import json
import shutil
from pathlib import Path

from app.config import Settings
from app.models.domain import (
    Artifact,
    ArtifactRole,
    Assignment,
    AssignmentFamily,
    AssignmentStatus,
    BundleArtifact,
    Case,
    CaseResponse,
    CaseSession,
    DashboardActivity,
    ExtractedSection,
    ImportBundle,
    ImportItem,
    ImportJob,
    ImportStatus,
    PreviewFlag,
    PreviewMetadata,
    ResponseSummary,
    Result,
    ReviewStatus,
    SessionDefaults,
    SessionMode,
    SessionStatus,
    SourceKind,
    SourceRef,
    User,
    UserPreferences,
    now_iso,
)
from app.providers.ai.demo import DemoAIProvider
from app.services.parsing import extract_sections
from app.services.text import slugify


DEFAULT_SESSION_DEFAULTS = SessionDefaults(
    question_count=6,
    answer_duration_seconds=120,
    allow_rerecord=True,
    response_mode=SessionMode.AUDIO_ONLY,
)


class DemoSeedBuilder:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.ai = DemoAIProvider()
        self.runtime_storage = settings.demo_runtime_path / "storage"
        self.seed_output_root = settings.demo_data_path / "generated"

    def reset_runtime(self) -> None:
        for path in [self.settings.demo_runtime_path, self.seed_output_root]:
            if path.exists():
                shutil.rmtree(path)
            path.mkdir(parents=True, exist_ok=True)
        self.runtime_storage.mkdir(parents=True, exist_ok=True)

    def build(self) -> dict:
        self.reset_runtime()
        user = self._demo_user()
        assignments = [
            self._build_sustainability_assignment(user.id),
            self._build_strategy_assignment(user.id),
            self._build_notebook_assignment(user.id),
        ]
        activities = self._build_activity_feed(assignments)
        return {
            "users": [user.model_dump(by_alias=True)],
            "assignments": assignments,
            "auditEvents": [],
            "activityFeed": [item.model_dump(by_alias=True) for item in activities],
        }

    def write_store(self, dataset: dict) -> Path:
        target = self.settings.demo_runtime_path / "demo_store.json"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(dataset, indent=2), encoding="utf-8")
        return target

    def _demo_user(self) -> User:
        now = now_iso()
        return User(
            id="user_demo_reviewer",
            email="demo@concentra.app",
            display_name="Alex Mercer",
            role="reviewer",
            created_at=now,
            updated_at=now,
            preferences=UserPreferences(
                theme="dark",
                default_session_preferences=DEFAULT_SESSION_DEFAULTS,
                demo_mode_helpers=True,
            ),
        )

    def _build_sustainability_assignment(self, user_id: str) -> dict:
        title = "Sustainability Impact Report: Campus Food Delivery"
        assignment_id = "assignment_sustainability_report"
        artifacts = [
            self._create_assignment_artifact(
                assignment_id,
                "01_assignment_brief.md",
                ArtifactRole.ASSIGNMENT_BRIEF,
                """
# Assignment Brief

## Context
Your task is to evaluate the sustainability impact of a campus food delivery service and recommend one operational change that would materially reduce emissions or waste.

## Deliverable
Submit a 1,400-1,800 word report that quantifies the current impact, compares at least two intervention options, and ends with a defended recommendation.

## Expectations
- Use at least three evidence sources from the provided dataset pack.
- Make tradeoffs explicit.
- Include one limitation section.
                """.strip(),
                "A structured brief for a written sustainability report.",
            ),
            self._create_assignment_artifact(
                assignment_id,
                "02_rubric.md",
                ArtifactRole.RUBRIC,
                """
# Rubric

## Criteria
1. Problem framing and baseline definition
2. Quality of evidence and interpretation
3. Strength of recommendation and tradeoff handling
4. Limitation awareness
5. Clarity and originality of reasoning
                """.strip(),
                "Rubric criteria used to ground oral verification goals.",
            ),
            self._create_assignment_artifact(
                assignment_id,
                "03_teacher_note.md",
                ArtifactRole.TEACHER_NOTE,
                """
# Teacher Note

Most reports will sound polished. In oral verification, probe whether students can defend why they weighted packaging, batching, or route optimization the way they did.
                """.strip(),
                "Teacher guidance emphasizing weighting decisions and tradeoffs.",
            ),
        ]
        assignment = self._base_assignment(assignment_id, title, AssignmentFamily.REPORT_ESSAY, user_id)
        assignment.assignment_understanding = self.ai.understand_assignment(assignment, artifacts)
        assignment.ai_summary = assignment.assignment_understanding.assignment_summary
        assignment.verification_goals = assignment.assignment_understanding.verification_goals

        students = [
            ("S24103", "Maya Chen", "low"),
            ("S24111", "Daniel Ortiz", "medium"),
            ("S24128", "Priya Menon", "high"),
            ("S24132", "Liam Walker", "medium"),
            ("S24144", "Sofia Alvarez", "low"),
        ]
        return self._assemble_assignment_record(
            assignment=assignment,
            artifacts=artifacts,
            students=students,
            theme="campus food delivery",
            body_templates={
                "low": "The report argues that batching deliveries during peak lunch windows is the highest-leverage intervention because it lowers route duplication without increasing waste. It uses trip-density data from the service logs, compares packaging redesign against route changes, and explicitly frames the rebound risk that slower delivery times might reduce student adoption.",
                "medium": "The report recommends a packaging-plus-batching approach and cites the emissions summary table, but the comparison between the options compresses some of the assumptions. The conclusion is directionally strong, though the weighting logic is more implicit than explicit.",
                "high": "The report favors reusable containers and mentions routing, but the evidence trail is thin and the recommendation changes tone across sections. Several claims sound plausible, yet the explanation of why one option was preferred is not consistently supported.",
            },
        )

    def _build_strategy_assignment(self, user_id: str) -> dict:
        title = "Product Strategy Deck: Habit-Based Budgeting Launch"
        assignment_id = "assignment_strategy_deck"
        artifacts = [
            self._create_assignment_artifact(
                assignment_id,
                "01_assignment_brief.md",
                ArtifactRole.ASSIGNMENT_BRIEF,
                """
# Assignment Brief

Prepare a short strategy deck for a fictional fintech company considering a habit-based budgeting launch for young professionals.

## Deliverable
- 8-10 slides
- one recommendation
- explicit market, product, and rollout tradeoffs
                """.strip(),
                "Brief for a concise product strategy presentation.",
            ),
            self._create_assignment_artifact(
                assignment_id,
                "02_rubric.md",
                ArtifactRole.RUBRIC,
                """
# Rubric

1. Problem definition and user insight
2. Strategic logic and prioritization
3. Evidence backing the recommendation
4. Narrative coherence and executive clarity
5. Ownership of tradeoffs
                """.strip(),
                "Presentation rubric that rewards prioritization and narrative clarity.",
            ),
            self._create_assignment_artifact(
                assignment_id,
                "03_slide_instructions.md",
                ArtifactRole.SUPPORT_MATERIAL,
                """
# Slide Instructions

Use slide titles as claims, not labels. Every recommendation slide should make the tradeoff legible enough to defend live.
                """.strip(),
                "Slide-specific guidance about claims and tradeoffs.",
            ),
        ]
        assignment = self._base_assignment(assignment_id, title, AssignmentFamily.PRESENTATION_SLIDES, user_id)
        assignment.assignment_understanding = self.ai.understand_assignment(assignment, artifacts)
        assignment.ai_summary = assignment.assignment_understanding.assignment_summary
        assignment.verification_goals = assignment.assignment_understanding.verification_goals

        students = [
            ("S24201", "Noah Kim", "low"),
            ("S24208", "Aisha Rahman", "medium"),
            ("S24217", "Ben Carter", "high"),
            ("S24226", "Grace Liu", "medium"),
            ("S24233", "Mateo Rivera", "low"),
        ]
        return self._assemble_assignment_record(
            assignment=assignment,
            artifacts=artifacts,
            students=students,
            theme="habit-based budgeting",
            body_templates={
                "low": "The deck argues for a narrow launch focused on salary earners with irregular spending spikes, and it uses cohort retention data to defend why habit nudges should ship before automated savings. The storyline explicitly trades reach for adoption quality.",
                "medium": "The deck presents a clear recommendation for habit-based budgeting, but some of the narrative transitions rely on implied logic rather than explicit evidence. The tradeoff slide is present, though not fully unpacked.",
                "high": "The deck recommends the launch, yet the reasons shift between engagement, monetization, and brand differentiation. The slides look polished, but the prioritization logic is harder to reconstruct verbally.",
            },
        )

    def _build_notebook_assignment(self, user_id: str) -> dict:
        title = "Technical Notebook: Urban Mobility Demand Analysis"
        assignment_id = "assignment_mobility_notebook"
        artifacts = [
            self._create_assignment_artifact(
                assignment_id,
                "01_assignment_brief.md",
                ArtifactRole.ASSIGNMENT_BRIEF,
                """
# Assignment Brief

Analyze a mobility dataset and explain what factors best predict demand spikes in an urban bike-share system.

## Deliverable
- notebook export or markdown equivalent
- short write-up
- one chart that supports the conclusion
                """.strip(),
                "Technical brief for a data analysis notebook assignment.",
            ),
            self._create_assignment_artifact(
                assignment_id,
                "02_rubric.md",
                ArtifactRole.RUBRIC,
                """
# Rubric

1. Reproducible analytical workflow
2. Data cleaning and assumption handling
3. Model or method justification
4. Interpretation of results
5. Communication of caveats
                """.strip(),
                "Rubric for technical reasoning and interpretation.",
            ),
            self._create_assignment_artifact(
                assignment_id,
                "03_teacher_guidance.md",
                ArtifactRole.TEACHER_NOTE,
                """
# Teacher Guidance

Students often memorize charts without understanding the preprocessing chain. Ask them to defend why weather, commute timing, or station density mattered in their analysis.
                """.strip(),
                "Instructor note emphasizing preprocessing and feature choices.",
            ),
        ]
        assignment = self._base_assignment(assignment_id, title, AssignmentFamily.TECHNICAL_NOTEBOOK, user_id)
        assignment.assignment_understanding = self.ai.understand_assignment(assignment, artifacts)
        assignment.ai_summary = assignment.assignment_understanding.assignment_summary
        assignment.verification_goals = assignment.assignment_understanding.verification_goals

        students = [
            ("S24302", "Harper Singh", "low"),
            ("S24309", "Jonas Park", "medium"),
            ("S24314", "Elena Rossi", "high"),
            ("S24321", "Owen Brooks", "medium"),
            ("S24337", "Leila Hassan", "low"),
        ]
        return self._assemble_assignment_record(
            assignment=assignment,
            artifacts=artifacts,
            students=students,
            theme="urban mobility demand",
            body_templates={
                "low": "The notebook compares temporal demand features, weather variables, and station-level density, then explains why a simpler interpretable model was chosen over a more opaque alternative. The write-up clearly separates signal from correlation and includes caveats about event days.",
                "medium": "The notebook identifies commute timing and rainfall as important, but the preprocessing logic is only lightly narrated. The analysis is plausible, though some of the feature engineering rationale is compressed.",
                "high": "The notebook presents a final chart and references a model, but the route from raw data to the conclusion is thin. The interpretation sounds credible on the surface yet leaves uncertainty about why certain analytical choices were made.",
            },
        )

    def _assemble_assignment_record(
        self,
        *,
        assignment: Assignment,
        artifacts: list[Artifact],
        students: list[tuple[str, str, str]],
        theme: str,
        body_templates: dict[str, str],
    ) -> dict:
        cases = []
        import_items: list[ImportItem] = []
        import_bundles: list[ImportBundle] = []
        completed_sessions = 0
        pending_reviews = 0

        for index, (student_id, student_name, quality) in enumerate(students, start=1):
            artifact_bundle = self._create_student_bundle(
                assignment_id=assignment.id,
                student_id=student_id,
                student_name=student_name,
                family=assignment.family,
                theme=theme,
                quality=quality,
                body_template=body_templates[quality],
            )
            case = self._create_case(
                assignment=assignment,
                student_id=student_id,
                student_name=student_name,
                quality=quality,
                bundle=artifact_bundle,
            )
            if case["session"]["status"] in {"completed", "transcript_ready", "summary_ready"}:
                completed_sessions += 1
            if case["reviewStatus"] == "needs_review":
                pending_reviews += 1
            for bundle_artifact in case["bundleArtifacts"]:
                import_items.append(
                    ImportItem(
                        id=f"import_item_{bundle_artifact['id']}",
                        file_name=bundle_artifact["fileName"],
                        storage_path=bundle_artifact["storagePath"],
                        detected_student_identifier=student_id,
                        matched_student_identifier=student_id,
                        detected_role=bundle_artifact["role"],
                        confidence=0.93,
                        bundle_id=f"bundle_{student_id.lower()}",
                        unresolved_reason=None,
                        created_at=bundle_artifact["createdAt"],
                    )
                )
            import_bundles.append(
                ImportBundle(
                    bundle_id=f"bundle_{student_id.lower()}",
                    student_identifier=student_id,
                    student_name=student_name,
                    student_email=f"{slugify(student_name)}@student.demo",
                    file_count=len(case["bundleArtifacts"]),
                    submission_family=assignment.family,
                    confidence=0.92 if len(case["bundleArtifacts"]) > 1 else 0.84,
                    unresolved=False,
                )
            )
            cases.append(case)

        now = now_iso()
        import_job = ImportJob(
            id=f"import_{assignment.id}",
            created_at=now,
            created_by=assignment.created_by,
            status=ImportStatus.COMPLETED,
            source_type="mixed",
            roster_csv_path=None,
            files_count=len(import_items),
            detected_students_count=len(import_bundles),
            unresolved_items_count=0,
            stage_labels=[
                "uploading",
                "classifying files",
                "detecting student identifiers",
                "grouping bundles",
                "creating cases",
            ],
            imported_artifacts=import_items,
            detected_bundles=import_bundles,
        )
        assignment.artifact_count = len(artifacts)
        assignment.case_count = len(cases)
        assignment.completed_session_count = completed_sessions
        assignment.pending_review_count = pending_reviews
        assignment.status = AssignmentStatus.READY
        assignment.updated_at = now
        return {
            **assignment.model_dump(by_alias=True),
            "artifacts": [artifact.model_dump(by_alias=True) for artifact in artifacts],
            "imports": [{**import_job.model_dump(by_alias=True)}],
            "cases": cases,
        }

    def _base_assignment(self, assignment_id: str, title: str, family: AssignmentFamily, user_id: str) -> Assignment:
        now = now_iso()
        placeholder_assignment = Assignment.model_construct(
            id=assignment_id,
            title=title,
            family=family,
            description="",
            status=AssignmentStatus.DRAFT,
            created_by=user_id,
            created_at=now,
            updated_at=now,
            session_defaults=DEFAULT_SESSION_DEFAULTS,
            verification_goals=[],
            ai_summary="",
            ai_summary_confidence=0.0,
            assignment_understanding=None,
            artifact_count=0,
            case_count=0,
            completed_session_count=0,
            pending_review_count=0,
        )
        placeholder_understanding = self.ai.understand_assignment(placeholder_assignment, [])
        return Assignment(
            id=assignment_id,
            title=title,
            family=family,
            description="",
            status=AssignmentStatus.ACTIVE,
            created_by=user_id,
            created_at=now,
            updated_at=now,
            session_defaults=DEFAULT_SESSION_DEFAULTS,
            verification_goals=placeholder_understanding.verification_goals,
            ai_summary=placeholder_understanding.assignment_summary,
            ai_summary_confidence=0.91,
            assignment_understanding=placeholder_understanding,
            artifact_count=0,
            case_count=0,
            completed_session_count=0,
            pending_review_count=0,
        )

    def _create_assignment_artifact(
        self,
        assignment_id: str,
        file_name: str,
        role: ArtifactRole,
        content: str,
        summary: str,
    ) -> Artifact:
        storage_path = self._write_demo_file(assignment_id, file_name, content)
        sections = extract_sections(content)
        return Artifact(
            id=f"artifact_{assignment_id}_{slugify(file_name)}",
            file_name=file_name,
            storage_path=storage_path,
            mime_type="text/markdown",
            original_size=len(content.encode("utf-8")),
            role=role,
            detected_role=role,
            role_confidence=0.94,
            extracted_text=content,
            extracted_structure=sections,
            preview_metadata=PreviewMetadata(
                kind="document",
                summary=summary,
                page_count=max(1, len(sections)),
                highlighted_sections=[section.title for section in sections[:3]],
            ),
            created_at=now_iso(),
        )

    def _create_student_bundle(
        self,
        *,
        assignment_id: str,
        student_id: str,
        student_name: str,
        family: AssignmentFamily,
        theme: str,
        quality: str,
        body_template: str,
    ) -> list[BundleArtifact]:
        artifacts: list[BundleArtifact] = []
        if family == AssignmentFamily.REPORT_ESSAY:
            files = [
                (
                    f"{student_id}_{slugify(student_name)}_impact_report.md",
                    ArtifactRole.PRIMARY_SUBMISSION,
                    self._report_submission(student_name, theme, body_template),
                    "document",
                )
            ]
        elif family == AssignmentFamily.PRESENTATION_SLIDES:
            files = [
                (
                    f"{student_id}_{slugify(student_name)}_strategy_deck.md",
                    ArtifactRole.VISUAL_SUBMISSION,
                    self._deck_submission(student_name, theme, body_template),
                    "slides",
                ),
                (
                    f"{student_id}_{slugify(student_name)}_speaker_notes.md",
                    ArtifactRole.SUPPORT_SUBMISSION,
                    self._speaker_notes(student_name, theme, quality),
                    "document",
                ),
            ]
        else:
            files = [
                (
                    f"{student_id}_{slugify(student_name)}_analysis_notebook.md",
                    ArtifactRole.TECHNICAL_SUBMISSION,
                    self._notebook_submission(student_name, theme, body_template),
                    "technical",
                ),
                (
                    f"{student_id}_{slugify(student_name)}_writeup.md",
                    ArtifactRole.SUPPORT_SUBMISSION,
                    self._notebook_writeup(student_name, theme, quality),
                    "document",
                ),
            ]
        for file_name, role, content, preview_kind in files:
            storage_path = self._write_demo_file(assignment_id, file_name, content, subdir="student-submissions")
            sections = extract_sections(content)
            artifacts.append(
                BundleArtifact(
                    id=f"bundle_artifact_{assignment_id}_{slugify(file_name)}",
                    file_name=file_name,
                    storage_path=storage_path,
                    role=role,
                    extracted_text=content,
                    extracted_structure=sections,
                    preview_metadata=PreviewMetadata(
                        kind=preview_kind,
                        summary=f"{student_name}'s {preview_kind.replace('_', ' ')} for {theme}.",
                        page_count=max(1, len(sections)),
                        slide_count=len(sections) if preview_kind == "slides" else None,
                        highlighted_sections=[section.title for section in sections[:3]],
                    ),
                    created_at=now_iso(),
                )
            )
        return artifacts

    def _create_case(
        self,
        *,
        assignment: Assignment,
        student_id: str,
        student_name: str,
        quality: str,
        bundle: list[BundleArtifact],
    ) -> dict:
        now = now_iso()
        case_model = Case(
            id=f"case_{assignment.id}_{student_id.lower()}",
            assignment_id=assignment.id,
            student_identifier=student_id,
            student_name=student_name,
            student_email=f"{slugify(student_name)}@student.demo",
            submission_family=assignment.family,
            bundle_artifact_ids=[artifact.id for artifact in bundle],
            ai_confidence={"low": 0.94, "medium": 0.82, "high": 0.69}[quality],
            focus_points=[],
            generated_questions=[],
            session_link_token=f"session_{assignment.id}_{student_id.lower()}",
            session_status=SessionStatus.NOT_SENT,
            review_status=ReviewStatus.NOT_STARTED,
            preview_summary="",
            preview_flags=[],
            created_at=now,
            updated_at=now,
        )
        bundle_as_artifacts = [
            Artifact(
                id=item.id,
                file_name=item.file_name,
                storage_path=item.storage_path,
                mime_type="text/markdown",
                original_size=len(item.extracted_text.encode("utf-8")),
                role=item.role,
                detected_role=item.role,
                role_confidence=0.93,
                extracted_text=item.extracted_text,
                extracted_structure=item.extracted_structure,
                preview_metadata=item.preview_metadata,
                created_at=item.created_at,
            )
            for item in bundle
        ]
        submission_summary, focus_points, _ = self.ai.extract_focus_points(
            assignment=assignment,
            case=case_model,
            bundle_artifacts=bundle_as_artifacts,
        )
        case_model.focus_points = focus_points
        case_model.generated_questions = self.ai.generate_questions(
            assignment=assignment,
            case=case_model,
            focus_points=focus_points,
        )
        concerns = self._quality_concerns(case_model.id, quality)
        preview_flags = self.ai.build_preview_flags(case=case_model, concerns=concerns)
        case_model.preview_flags = preview_flags
        case_model.preview_summary = self._preview_summary(len(focus_points), preview_flags)

        session = CaseSession(
            id=f"session_{case_model.id}",
            token=case_model.session_link_token,
            mode=assignment.session_defaults.response_mode,
            question_count=assignment.session_defaults.question_count,
            answer_duration_seconds=assignment.session_defaults.answer_duration_seconds,
            allow_rerecord=assignment.session_defaults.allow_rerecord,
            status=SessionStatus.SENT if quality in {"low", "medium", "high"} else SessionStatus.NOT_SENT,
            started_at=now if quality in {"low", "medium", "high"} else None,
            completed_at=None,
        )
        responses: list[CaseResponse] = []
        result: Result | None = None

        if quality in {"low", "medium", "high"}:
            for question in case_model.generated_questions:
                transcript = self._scripted_transcript(assignment.family, quality, question.focus_label)
                response = CaseResponse(
                    id=f"response_{question.id}",
                    question_id=question.id,
                    audio_path=f"seed-audio/{case_model.id}/{question.id}.webm",
                    video_path=None,
                    transcript_text=transcript,
                    transcript_confidence=0.95 if quality == "low" else 0.89 if quality == "medium" else 0.84,
                    answer_summary="",
                    duration_seconds=84 if quality == "low" else 67 if quality == "medium" else 53,
                    summary=ResponseSummary(
                        answer_summary="",
                        evidence_quality="medium",  # type: ignore[arg-type]
                        signals=[],
                        confidence=0.0,
                    ),
                    created_at=now_iso(),
                )
                self.ai.summarize_response(
                    assignment=assignment,
                    case=case_model,
                    question=question,
                    response=response,
                    related_sources=question.source_refs,
                )
                responses.append(response)
            session.status = SessionStatus.SUMMARY_READY
            session.completed_at = now_iso()
            case_model.session_status = SessionStatus.SUMMARY_READY
            case_model.review_status = ReviewStatus.NEEDS_REVIEW if quality in {"medium", "high"} else ReviewStatus.REVIEWED
            result = self.ai.synthesize_result(
                assignment=assignment,
                case=case_model,
                responses=responses,
                focus_points=focus_points,
                questions=case_model.generated_questions,
            )
            if quality == "low":
                result.final_reviewer_note = "Consistent oral defense. Final review completed with no additional follow-up required."
                result.reviewed_at = now_iso()
                result.reviewed_by = assignment.created_by
            elif quality == "medium":
                result.final_reviewer_note = ""
            else:
                result.final_reviewer_note = ""
        case_dict = case_model.model_dump(by_alias=True)
        case_dict["bundleArtifacts"] = [item.model_dump(by_alias=True) for item in bundle]
        case_dict["session"] = session.model_dump(by_alias=True)
        case_dict["questions"] = [question.model_dump(by_alias=True) for question in case_model.generated_questions]
        case_dict["responses"] = [response.model_dump(by_alias=True) for response in responses]
        case_dict["result"] = result.model_dump(by_alias=True) if result else None
        return case_dict

    def _quality_concerns(self, case_id: str, quality: str) -> list[dict]:
        if quality == "low":
            return []
        if quality == "medium":
            return [
                {
                    "id": f"{case_id}_concern_tradeoff",
                    "type": "compressed_tradeoff",
                    "description": "One tradeoff is present in the submission but described more implicitly than explicitly.",
                    "confidence": 0.74,
                }
            ]
        return [
            {
                "id": f"{case_id}_concern_support",
                "type": "unsupported_claim",
                "description": "A key claim sounds polished, but the supporting rationale is thin enough to probe directly.",
                "confidence": 0.86,
            },
            {
                "id": f"{case_id}_concern_ownership",
                "type": "ownership_gap",
                "description": "The strongest section would benefit from oral defense to confirm authorship of the reasoning chain.",
                "confidence": 0.84,
            },
        ]

    def _preview_summary(self, focus_count: int, flags: list[PreviewFlag]) -> str:
        attention_count = sum(1 for flag in flags if flag.tone != "neutral")
        return f"{focus_count} focus points generated · {attention_count} flagged areas · summary ready"

    def _scripted_transcript(self, family: AssignmentFamily, quality: str, focus_label: str) -> str:
        family_openers = {
            AssignmentFamily.REPORT_ESSAY: {
                "low": "I chose that claim after comparing the route optimization option with packaging changes and seeing that the route data created the larger impact without introducing a new compliance burden.",
                "medium": "I can explain the claim, although I would probably need the report in front of me to cite the exact figure I used there.",
                "high": "I remember the general idea of that section, but I am not completely certain about why I weighted it above the other option in the final version.",
            },
            AssignmentFamily.PRESENTATION_SLIDES: {
                "low": "That slide exists to make the audience accept the tradeoff before I reveal the recommendation, because otherwise the recommendation sounds more opinionated than strategic.",
                "medium": "The slide sequence was intentional, though I condensed some of the reasoning and would explain it more fully in a live setting.",
                "high": "I knew the recommendation direction, but I do not think I can restate every tradeoff as clearly as it appears in the deck.",
            },
            AssignmentFamily.TECHNICAL_NOTEBOOK: {
                "low": "I used that analytical step because it kept the feature logic interpretable and made it easier to compare temporal effects against weather without overfitting the notebook.",
                "medium": "I can describe the method choice, although some of the preprocessing details are easier to follow in the notebook than from memory.",
                "high": "I remember the broad workflow, but I would need the notebook to walk through why that exact step came before the others.",
            },
            AssignmentFamily.MIXED_SUBMISSION: {
                "low": "I linked those artifacts on purpose so the explanation and the evidence could be defended together rather than as separate pieces.",
                "medium": "The pieces connect, but I would probably phrase the reasoning more explicitly if I rebuilt the bundle now.",
                "high": "I know the overall idea, but some of the detailed links between the files are hard to reconstruct from memory.",
            },
        }
        detail = {
            "low": f"The important point in `{focus_label}` is that I can trace it back to a specific choice, a specific source section, and a clear limitation.",
            "medium": f"`{focus_label}` was important to me, but some of the rationale stayed compressed in the final version.",
            "high": f"`{focus_label}` is where I am least confident orally because the written version carries more detail than I can easily restate.",
        }[quality]
        closer = {
            "low": "If you asked me to defend it again, I would point to the same section and explain the tradeoff the same way.",
            "medium": "The reasoning is still there, but I would want one clarifying follow-up to make it sharper.",
            "high": "I would need to review the submission before I could defend that section with the same specificity.",
        }[quality]
        return " ".join([family_openers[family][quality], detail, closer])

    def _build_activity_feed(self, assignments: list[dict]) -> list[DashboardActivity]:
        activities: list[DashboardActivity] = []
        for assignment in assignments:
            activities.append(
                DashboardActivity(
                    id=f"activity_import_{assignment['id']}",
                    type="imported_submissions",
                    title=f"Imported submissions for {assignment['title']}",
                    detail=f"{assignment['caseCount']} student cases were generated from the latest import.",
                    assignment_id=assignment["id"],
                    created_at=assignment["updatedAt"],
                )
            )
            for case in assignment["cases"][:2]:
                activities.append(
                    DashboardActivity(
                        id=f"activity_case_{case['id']}",
                        type="completed_session",
                        title=f"{case['studentName']} completed oral verification",
                        detail=case["previewSummary"],
                        assignment_id=assignment["id"],
                        case_id=case["id"],
                        created_at=case["updatedAt"],
                    )
                )
        return activities[:10]

    def _write_demo_file(self, assignment_id: str, file_name: str, content: str, subdir: str = "assignment-artifacts") -> str:
        relative = Path(assignment_id) / subdir / file_name
        runtime_path = self.runtime_storage / relative
        runtime_path.parent.mkdir(parents=True, exist_ok=True)
        runtime_path.write_text(content, encoding="utf-8")

        seed_path = self.seed_output_root / relative
        seed_path.parent.mkdir(parents=True, exist_ok=True)
        seed_path.write_text(content, encoding="utf-8")
        return relative.as_posix()

    def _report_submission(self, student_name: str, theme: str, core: str) -> str:
        return f"""
# Executive Framing

{student_name} evaluates {theme} and argues for the operational change that creates the clearest reduction in environmental impact without undermining adoption.

## Baseline Assessment

{core}

## Evidence Interpretation

The report compares operational emissions, packaging waste, and the practical cost of implementation. It explicitly weighs the intervention that changes behavior against the intervention that only changes materials.

## Limitations

The report notes that campus event days distort route density and that spend-based estimates for packaging overstate some categories.

## Recommendation

The final recommendation prioritizes the intervention with the strongest combination of measurable impact and implementation realism.
        """.strip()

    def _deck_submission(self, student_name: str, theme: str, core: str) -> str:
        return f"""
# Slide 1 — Decision Frame

{student_name} recommends a focused launch path for {theme}.

## Slide 2 — User Tension

The deck frames the target user as motivated but inconsistent, which makes habit formation more important than feature breadth on day one.

## Slide 3 — Strategic Case

{core}

## Slide 4 — Tradeoff

The recommendation trades initial reach for a clearer behavioral loop and better retention signal.

## Slide 5 — Launch Plan

The rollout starts with a narrow cohort, a weekly reflection loop, and a limited success metric set.
        """.strip()

    def _speaker_notes(self, student_name: str, theme: str, quality: str) -> str:
        qualifier = {
            "low": "Notes clearly defend why the recommendation should ship before adjacent roadmap ideas.",
            "medium": "Notes capture the key story but leave some transitions more implied than explicit.",
            "high": "Notes emphasize confidence in the recommendation more than the logic behind it.",
        }[quality]
        return f"""
# Speaker Notes

{student_name} uses the notes to explain the live narrative for the {theme} deck.

## Delivery Intent

{qualifier}
        """.strip()

    def _notebook_submission(self, student_name: str, theme: str, core: str) -> str:
        return f"""
# Notebook Overview

{student_name} analyzes {theme} using a staged workflow from cleaning to feature interpretation.

## Data Preparation

The notebook standardizes timestamps, handles missing weather rows, and creates commute-window features to test demand spikes.

## Analytical Reasoning

{core}

## Result Interpretation

The notebook distinguishes predictive usefulness from causal certainty and flags event-day distortion as a caveat.

## Conclusion

The final conclusion explains which features best predict demand spikes and why those signals matter operationally.
        """.strip()

    def _notebook_writeup(self, student_name: str, theme: str, quality: str) -> str:
        qualifier = {
            "low": "The write-up explains why interpretability was prioritized over model complexity.",
            "medium": "The write-up summarizes the notebook well, but some preprocessing choices stay compressed.",
            "high": "The write-up states the conclusion confidently while glossing over parts of the method chain.",
        }[quality]
        return f"""
# Technical Write-up

{student_name} summarizes the {theme} analysis and the confidence level behind the final result.

## Commentary

{qualifier}
        """.strip()
