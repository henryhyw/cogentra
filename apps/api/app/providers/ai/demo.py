from __future__ import annotations

from collections import defaultdict

from app.models.domain import (
    Artifact,
    ArtifactRole,
    Assignment,
    AssignmentFamily,
    AssignmentUnderstanding,
    Case,
    CaseResponse,
    EvidenceCard,
    EvidenceQuality,
    Explainability,
    FocusPoint,
    FocusPointReview,
    FocusPointState,
    GeneratedQuestion,
    PerQuestionBreakdown,
    PreviewFlag,
    Result,
    ReviewPriority,
    SourceKind,
    SourceRef,
    VerificationGoal,
)
from app.providers.ai.base import AIProvider, ArtifactClassificationResult, BundleGroupingResult
from app.services.text import extract_student_identifier, stable_hash


FAMILY_GOALS = {
    AssignmentFamily.REPORT_ESSAY: [
        ("goal_reasoning_depth", "Reasoning Depth", "Can the student defend how the argument was built rather than just restating conclusions?"),
        ("goal_evidence_interpretation", "Evidence Interpretation", "Can the student explain how the cited evidence shaped their claims?"),
        ("goal_limitation_awareness", "Limitation Awareness", "Can the student acknowledge uncertainty, tradeoffs, and missing evidence?"),
        ("goal_ownership", "Ownership Of Work", "Can the student explain decisions in a way that signals authentic authorship?")
    ],
    AssignmentFamily.PRESENTATION_SLIDES: [
        ("goal_strategic_clarity", "Strategic Clarity", "Can the student defend the core recommendation and the narrative structure behind it?"),
        ("goal_tradeoff_reasoning", "Tradeoff Reasoning", "Can the student justify prioritization choices and rejected options?"),
        ("goal_evidence_signal", "Evidence Signal", "Can the student explain which evidence actually drove the deck?"),
        ("goal_ownership", "Ownership Of Storyline", "Can the student explain how the slides and notes were assembled?")
    ],
    AssignmentFamily.TECHNICAL_NOTEBOOK: [
        ("goal_method_understanding", "Method Understanding", "Can the student explain the analysis workflow and why each step was chosen?"),
        ("goal_data_quality", "Data Quality Awareness", "Can the student discuss assumptions, cleaning choices, and model limits?"),
        ("goal_interpretation", "Result Interpretation", "Can the student separate outputs from conclusions?"),
        ("goal_ownership", "Notebook Ownership", "Can the student defend the implementation, not just the final chart?")
    ],
    AssignmentFamily.MIXED_SUBMISSION: [
        ("goal_synthesis", "Synthesis", "Can the student connect the different artifacts into one coherent explanation?"),
        ("goal_evidence", "Evidence Selection", "Can the student justify which sources or assets were most important?"),
        ("goal_tradeoffs", "Decision Tradeoffs", "Can the student explain why certain choices were made over alternatives?"),
        ("goal_ownership", "Ownership", "Can the student explain how the full bundle came together?")
    ],
}


FAMILY_PROMPTS = {
    AssignmentFamily.REPORT_ESSAY: [
        "Walk me through how you chose the central claim in your report.",
        "Which piece of evidence in your report did the most work, and why?",
        "What limitation were you actively managing while writing?",
        "If I challenged your recommendation, what part of the report would you defend first?",
        "What decision in the structure of the report was most intentional?"
    ],
    AssignmentFamily.PRESENTATION_SLIDES: [
        "Why did you lead with that specific storyline in the deck?",
        "Which tradeoff did you think the audience might disagree with?",
        "What slide carries the strongest evidence, and why?",
        "How did you decide what to leave out of the final presentation?",
        "If you had thirty seconds to defend the recommendation, where would you start?"
    ],
    AssignmentFamily.TECHNICAL_NOTEBOOK: [
        "Walk me through the analysis sequence you chose in the notebook.",
        "Which assumption in the data workflow mattered most?",
        "What result did you treat as directional rather than definitive?",
        "If the reviewer challenged your method, what would you defend first?",
        "Which part of the notebook best demonstrates your own reasoning?"
    ],
    AssignmentFamily.MIXED_SUBMISSION: [
        "How do the different artifacts in your submission support the same argument?",
        "Which source or file was most important to your final decision?",
        "What tradeoff did you make when combining formats?",
        "What part of the bundle would you defend first under challenge?",
        "What did you intentionally keep concise, and why?"
    ],
}


class DemoAIProvider(AIProvider):
    def classify_artifact(self, *, file_name: str, mime_type: str, text_preview: str, is_student: bool) -> ArtifactClassificationResult:
        lower = f"{file_name} {text_preview[:200]}".lower()
        mapping = [
            ("rubric", ArtifactRole.RUBRIC, ["filename:rubric", "criteria language"]),
            ("brief", ArtifactRole.ASSIGNMENT_BRIEF, ["filename:brief", "instruction language"]),
            ("instruction", ArtifactRole.ASSIGNMENT_BRIEF, ["filename:instruction", "task framing"]),
            ("note", ArtifactRole.TEACHER_NOTE, ["filename:note", "teacher annotation"]),
            ("model", ArtifactRole.MODEL_ANSWER, ["filename:model", "sample answer"]),
            ("sample", ArtifactRole.MODEL_ANSWER, ["filename:sample", "exemplar language"]),
            ("deck", ArtifactRole.VISUAL_SUBMISSION if is_student else ArtifactRole.SUPPORT_MATERIAL, ["slides signal"]),
            ("slide", ArtifactRole.VISUAL_SUBMISSION if is_student else ArtifactRole.SUPPORT_MATERIAL, ["slides signal"]),
            ("notebook", ArtifactRole.TECHNICAL_SUBMISSION if is_student else ArtifactRole.SUPPORT_MATERIAL, ["technical file signal"]),
            ("analysis", ArtifactRole.TECHNICAL_SUBMISSION if is_student else ArtifactRole.SUPPORT_MATERIAL, ["analysis signal"]),
            ("essay", ArtifactRole.PRIMARY_SUBMISSION if is_student else ArtifactRole.ASSIGNMENT_BRIEF, ["essay/report signal"]),
            ("report", ArtifactRole.PRIMARY_SUBMISSION if is_student else ArtifactRole.ASSIGNMENT_BRIEF, ["essay/report signal"]),
            ("chart", ArtifactRole.SUPPORT_SUBMISSION if is_student else ArtifactRole.SUPPORT_MATERIAL, ["support asset"]),
            ("appendix", ArtifactRole.SUPPORT_SUBMISSION if is_student else ArtifactRole.SUPPORT_MATERIAL, ["appendix signal"]),
        ]
        for keyword, role, signals in mapping:
            if keyword in lower:
                confidence = 0.95 if keyword in file_name.lower() else 0.82
                return ArtifactClassificationResult(
                    role=role.value,
                    confidence=confidence,
                    reasoning=f"Detected `{keyword}` patterns in the file metadata and preview text.",
                    signals=signals,
                )
        fallback_role = ArtifactRole.PRIMARY_SUBMISSION if is_student else ArtifactRole.SUPPORT_MATERIAL
        confidence = 0.74 if mime_type.startswith("text/") else 0.68
        return ArtifactClassificationResult(
            role=fallback_role.value,
            confidence=confidence,
            reasoning="Used extension and generic content signals because no strong filename pattern was present.",
            signals=["mime-heuristic", "fallback"],
        )

    def understand_assignment(self, assignment: Assignment, artifacts: list[Artifact]) -> AssignmentUnderstanding:
        sources = [self._artifact_source_ref(artifact) for artifact in artifacts[:3]]
        goals = self._verification_goals_for_family(assignment.family)
        summary = {
            AssignmentFamily.REPORT_ESSAY: f"{assignment.title} asks students to build a defensible written argument, use evidence selectively, and explain the limits of their conclusions.",
            AssignmentFamily.PRESENTATION_SLIDES: f"{assignment.title} expects a concise strategic narrative with clear prioritization, evidence-backed storytelling, and ownership of the recommendation.",
            AssignmentFamily.TECHNICAL_NOTEBOOK: f"{assignment.title} expects a reproducible analysis with readable methodology, careful assumptions, and interpretation that stays grounded in the data.",
            AssignmentFamily.MIXED_SUBMISSION: f"{assignment.title} expects students to connect multiple artifact types into one coherent, defensible submission.",
        }[assignment.family]
        characteristics = {
            AssignmentFamily.REPORT_ESSAY: ["Structured argument", "Evidence-backed recommendation", "Explicit limitation handling"],
            AssignmentFamily.PRESENTATION_SLIDES: ["Narrative deck", "Prioritized insight flow", "Verbal defense of tradeoffs"],
            AssignmentFamily.TECHNICAL_NOTEBOOK: ["Notebook or report pairing", "Transparent method chain", "Result interpretation"],
            AssignmentFamily.MIXED_SUBMISSION: ["Multiple linked artifacts", "Cross-format explanation", "Decision rationale"],
        }[assignment.family]
        dimensions = [goal.label for goal in goals]
        explainability = Explainability(
            why="Combined artifact roles, assignment family, and rubric-style language to infer what a reviewer should verify orally.",
            referenced_sources=sources,
            model_confidence=0.91,
            signals=["family-template", "artifact-role-agreement", "rubric-aware"],
        )
        return AssignmentUnderstanding(
            assignment_summary=summary,
            assignment_family=assignment.family,
            verification_goals=goals,
            expected_submission_characteristics=characteristics,
            defensible_areas=[goal.label for goal in goals[:3]],
            verification_dimensions=dimensions,
            preferred_question_types=[
                "Ask for decision rationale tied to a specific section",
                "Ask the student to defend a claim with their own evidence path",
                "Ask for limitations, rejected options, or assumptions",
            ],
            avoid_question_types=[
                "Yes/no recall checks",
                "Pure rubric recitation",
                "Questions that only ask for definitions without submission context",
            ],
            reviewer_focus_advice=[
                "Start with the most defensible claim rather than the longest section.",
                "Use follow-ups when the student becomes generic or detached from the submission.",
                "Treat mismatches neutrally and anchor them to source sections.",
            ],
            explainability=explainability,
        )

    def group_student_bundles(
        self,
        *,
        assignment: Assignment,
        artifacts: list[Artifact],
        roster_text: str | None,
    ) -> BundleGroupingResult:
        grouped: dict[str, list[Artifact]] = defaultdict(list)
        unresolved = []
        for artifact in artifacts:
            identifier = extract_student_identifier(artifact.file_name)
            if not identifier:
                unresolved.append(
                    {
                        "artifactId": artifact.id,
                        "fileName": artifact.file_name,
                        "reason": "Unable to detect a student identifier from filename or folder pattern.",
                    }
                )
                continue
            grouped[identifier].append(artifact)
        bundles = []
        for identifier, bundle_artifacts in grouped.items():
            family_value = assignment.family.value if hasattr(assignment.family, "value") else assignment.family
            bundles.append(
                {
                    "bundleId": f"bundle_{identifier.lower()}",
                    "studentIdentifier": identifier,
                    "studentName": identifier.replace(".", " ").title() if "." in identifier else None,
                    "studentEmail": f"{identifier.lower()}@student.demo" if "." not in identifier else f"{identifier}@student.demo",
                    "artifactIds": [artifact.id for artifact in bundle_artifacts],
                    "submissionFamily": family_value,
                    "confidence": 0.93 if len(bundle_artifacts) > 1 else 0.81,
                }
            )
        explainability = Explainability(
            why="Grouped files using filename identifiers first, then scored bundles by how consistently files shared the same inferred student signal.",
            referenced_sources=[],
            model_confidence=0.89,
            signals=["filename-regex", "bundle-size", "family-consistency"],
        )
        return BundleGroupingResult(bundles=bundles, unresolved_items=unresolved, explainability=explainability)

    def extract_focus_points(
        self,
        *,
        assignment: Assignment,
        case: Case,
        bundle_artifacts: list[Artifact],
    ) -> tuple[str, list[FocusPoint], list[dict]]:
        sections = [
            section
            for artifact in bundle_artifacts
            for section in artifact.extracted_structure[:4]
        ]
        risk = self._risk_profile(case.student_identifier)
        focus_templates = self._focus_templates_for_family(assignment.family)
        focus_points = []
        concerns = []
        for index, template in enumerate(focus_templates, start=1):
            section = sections[(index - 1) % max(len(sections), 1)] if sections else None
            source_refs = [
                SourceRef(
                    artifact_id=bundle_artifacts[0].id if bundle_artifacts else None,
                    label=section.title if section else template["label"],
                    section_title=section.title if section else None,
                    locator=f"Section {section.order}" if section else "Submission overview",
                    excerpt=(section.body[:220] if section else bundle_artifacts[0].extracted_text[:220] if bundle_artifacts else ""),
                    kind=SourceKind.SUBMISSION,
                    score=0.82 + (index * 0.03),
                )
            ]
            focus_points.append(
                FocusPoint(
                    id=f"fp_{case.id}_{index}",
                    label=template["label"],
                    description=template["description"],
                    why_it_matters=template["why"],
                    related_goals=template["goals"],
                    source_refs=source_refs,
                    confidence=max(0.62, 0.91 - (index * 0.05)),
                    explainability=Explainability(
                        why=f"Selected this focus point because the submission surfaces `{template['label']}` as a claim or decision that benefits from oral defense.",
                        referenced_sources=source_refs,
                        model_confidence=max(0.62, 0.91 - (index * 0.05)),
                        signals=["section-coverage", "goal-alignment", "submission-specific"],
                    ),
                )
            )
        if risk in {"medium", "high"}:
            concerns.append(
                {
                    "id": f"concern_{case.id}_support",
                    "type": "unsupported_claim",
                    "description": "One key claim is asserted clearly in the submission, but the support path is relatively compressed and worth probing orally.",
                    "confidence": 0.74 if risk == "medium" else 0.86,
                }
            )
        if risk == "high":
            concerns.append(
                {
                    "id": f"concern_{case.id}_ownership",
                    "type": "vague_explanation_risk",
                    "description": "The strongest sections read polished, but the connective reasoning between steps is thin enough to merit focused verification.",
                    "confidence": 0.83,
                }
            )
        summary = {
            "low": "The submission is coherent and defensible, with clear focal areas for verification rather than broad concern.",
            "medium": "The submission is directionally solid, but one or two claims would benefit from concise oral defense.",
            "high": "The submission shows promise, though the most important claims and decision points likely need deeper oral verification.",
        }[risk]
        return summary, focus_points, concerns

    def generate_questions(
        self,
        *,
        assignment: Assignment,
        case: Case,
        focus_points: list[FocusPoint],
    ) -> list[GeneratedQuestion]:
        base_prompts = FAMILY_PROMPTS[assignment.family]
        questions = []
        for order in range(assignment.session_defaults.question_count):
            focus = focus_points[order % len(focus_points)]
            prompt = base_prompts[order % len(base_prompts)]
            text = f"{prompt} In particular, explain the thinking behind `{focus.label}`."
            questions.append(
                GeneratedQuestion(
                    id=f"q_{case.id}_{order + 1}",
                    order=order + 1,
                    text=text,
                    focus_label=focus.label,
                    focus_point_id=focus.id,
                    rationale=f"Targets `{focus.label}` so the reviewer can assess whether the student can defend the most verification-relevant part of the submission.",
                    expected_evidence="Specific decision rationale, concrete reference to the submission, and at least one limitation or tradeoff.",
                    source_refs=focus.source_refs,
                    confidence=max(0.64, 0.93 - (order * 0.04)),
                    explainability=Explainability(
                        why="Generated from the assignment-family question pack and anchored to a stored focus point plus source references.",
                        referenced_sources=focus.source_refs,
                        model_confidence=max(0.64, 0.93 - (order * 0.04)),
                        signals=["focus-point-linked", "oral-friendly", "family-specific"],
                    ),
                )
            )
        return questions

    def summarize_response(
        self,
        *,
        assignment: Assignment,
        case: Case,
        question: GeneratedQuestion,
        response: CaseResponse,
        related_sources: list[SourceRef],
    ) -> CaseResponse:
        transcript = response.transcript_text.lower()
        signals = []
        if "because" in transcript or "for example" in transcript or "the main" in transcript:
            signals.append("specific")
        if any(marker in transcript for marker in ["not sure", "fuzzy", "do not remember", "don't remember"]):
            signals.append("vague")
        if len(transcript.split()) < 45:
            signals.append("brief")
        if any(marker in transcript for marker in ["limitation", "constraint", "tradeoff"]):
            signals.append("self-aware")
        quality = EvidenceQuality.WEAK
        confidence = 0.72
        if "specific" in signals and "vague" not in signals and "brief" not in signals:
            quality = EvidenceQuality.STRONG
            confidence = 0.91
        elif "specific" in signals or "self-aware" in signals:
            quality = EvidenceQuality.MEDIUM
            confidence = 0.84
        summary_text = self._summary_from_transcript(response.transcript_text, question.focus_label)
        response.summary = response.summary or {
            "answerSummary": summary_text,
            "evidenceQuality": quality.value,
            "signals": signals or ["generic"],
            "confidence": confidence,
            "explainability": Explainability(
                why="Summarized the response using specificity, ownership, and limitation signals rather than transcript length alone.",
                referenced_sources=related_sources,
                model_confidence=confidence,
                signals=signals or ["generic"],
            ),
        }
        response.answer_summary = summary_text
        return response

    def synthesize_result(
        self,
        *,
        assignment: Assignment,
        case: Case,
        responses: list[CaseResponse],
        focus_points: list[FocusPoint],
        questions: list[GeneratedQuestion],
    ) -> Result:
        question_lookup = {question.id: question for question in questions}
        responses_by_focus: dict[str, list[CaseResponse]] = defaultdict(list)
        for response in responses:
            question = question_lookup.get(response.question_id)
            if question:
                responses_by_focus[question.focus_point_id].append(response)

        evidence_cards: list[EvidenceCard] = []
        focus_reviews: list[FocusPointReview] = []
        inconsistencies = []
        breakdown = []
        status_scores = []

        for focus in focus_points:
            bucket = responses_by_focus.get(focus.id, [])
            quality_values = [self._quality_score(response) for response in bucket]
            avg_quality = sum(quality_values) / len(quality_values) if quality_values else 0.45
            if avg_quality >= 0.8:
                state = FocusPointState.VERIFIED
            elif avg_quality >= 0.62:
                state = FocusPointState.PARTIALLY_VERIFIED
            elif avg_quality >= 0.46:
                state = FocusPointState.UNCLEAR
            else:
                state = FocusPointState.NEEDS_FOLLOW_UP
            status_scores.append(avg_quality)
            summary = {
                FocusPointState.VERIFIED: f"The student defended `{focus.label}` with specific reasoning tied back to the submission.",
                FocusPointState.PARTIALLY_VERIFIED: f"The student could explain `{focus.label}`, though parts of the defense stayed high-level.",
                FocusPointState.UNCLEAR: f"`{focus.label}` remains only partially grounded; the student referenced the idea but not the full rationale.",
                FocusPointState.NEEDS_FOLLOW_UP: f"`{focus.label}` still needs a clearer oral defense before the reviewer can rely on it.",
            }[state]
            review = FocusPointReview(
                focus_point_id=focus.id,
                label=focus.label,
                status=state,
                summary=summary,
                why_it_matters=focus.why_it_matters,
                confidence=min(0.95, max(0.52, avg_quality + 0.14)),
                evidence_ids=[],
                explainability=focus.explainability,
            )
            focus_reviews.append(review)
            if bucket:
                top_response = bucket[0]
                question = question_lookup[top_response.question_id]
                evidence_id = f"evidence_{focus.id}"
                evidence_cards.append(
                    EvidenceCard(
                        id=evidence_id,
                        title=focus.label,
                        finding=summary,
                        transcript_snippet=top_response.transcript_text[:260],
                        submission_reference=focus.source_refs[0].label if focus.source_refs else "Submission reference",
                        why_it_matters=focus.why_it_matters,
                        confidence=min(0.95, max(0.54, avg_quality + 0.12)),
                        source_refs=focus.source_refs + [
                            SourceRef(
                                label=question.text,
                                kind=SourceKind.TRANSCRIPT,
                                locator=f"Question {question.order}",
                                excerpt=top_response.transcript_text[:180],
                                score=0.82,
                            )
                        ],
                        explainability=Explainability(
                            why="Linked a focus point to the strongest response snippet and the originating submission section.",
                            referenced_sources=focus.source_refs,
                            model_confidence=min(0.95, max(0.54, avg_quality + 0.12)),
                            signals=["focus-linked", "transcript-grounded"],
                        ),
                    )
                )
                review.evidence_ids.append(evidence_id)
                if self._has_inconsistency_signal(top_response):
                    inconsistencies.append(
                        {
                            "id": f"inc_{focus.id}",
                            "type": "vague_explanation",
                            "description": "The student referenced the right area, but the explanation remained more generic than the written submission.",
                            "supportingTranscriptSnippet": top_response.transcript_text[:220],
                            "relatedSubmissionReference": focus.source_refs[0].label if focus.source_refs else "Submission section",
                            "confidence": 0.77,
                            "explainability": Explainability(
                                why="Flagged because the transcript stayed generic while the source section presents a more specific claim.",
                                referenced_sources=focus.source_refs,
                                model_confidence=0.77,
                                signals=["generic-language", "written-vs-oral-gap"],
                            ),
                        }
                    )

        for response in responses:
            question = question_lookup.get(response.question_id)
            if not question:
                continue
            breakdown.append(
                PerQuestionBreakdown(
                    question_id=question.id,
                    question_text=question.text,
                    response_summary=response.answer_summary,
                    transcript_snippet=response.transcript_text[:220],
                    linked_focus_point=question.focus_label,
                    related_submission_reference=question.source_refs[0].label if question.source_refs else "Submission section",
                    confidence=min(0.93, max(0.52, self._quality_score(response) + 0.15)),
                )
            )

        avg_score = sum(status_scores) / len(status_scores) if status_scores else 0.5
        if avg_score < 0.54 or len(inconsistencies) >= 2:
            priority = ReviewPriority.HIGH
            action = "Deeper review recommended"
        elif avg_score < 0.72:
            priority = ReviewPriority.MEDIUM
            action = "Follow-up clarification suggested"
        else:
            priority = ReviewPriority.LOW
            action = "Light review sufficient"

        executive_summary = self._build_executive_summary(case, priority, focus_reviews, inconsistencies)
        return Result(
            executive_summary=executive_summary,
            review_priority=priority,
            recommended_action=action,
            focus_point_statuses=focus_reviews,
            evidence_cards=evidence_cards,
            inconsistencies=[
                item if isinstance(item, dict) else item for item in inconsistencies
            ],
            per_question_breakdown=breakdown,
            final_reviewer_note="",
            reviewed_at=None,
            reviewed_by=None,
        )

    def build_preview_flags(self, *, case: Case, concerns: list[dict]) -> list[PreviewFlag]:
        flags = []
        for concern in concerns:
            tone = "warning" if concern["confidence"] > 0.82 else "attention"
            flags.append(
                PreviewFlag(
                    id=concern["id"],
                    tone=tone,
                    label=concern["type"].replace("_", " ").title(),
                    detail=concern["description"],
                    confidence=concern["confidence"],
                )
            )
        if not flags:
            flags.append(
                PreviewFlag(
                    id=f"flag_{case.id}_ready",
                    tone="neutral",
                    label="Summary Ready",
                    detail="Focus points and question set are ready for oral verification.",
                    confidence=0.94,
                )
            )
        return flags

    def _verification_goals_for_family(self, family: AssignmentFamily) -> list[VerificationGoal]:
        goals = []
        for order, (goal_id, label, description) in enumerate(FAMILY_GOALS[family], start=1):
            goals.append(
                VerificationGoal(
                    id=goal_id,
                    label=label,
                    description=description,
                    enabled=True,
                    order=order,
                    confidence=0.91 - (order * 0.03),
                    explainability=Explainability(
                        why=f"Derived `{label}` from the assignment family and the types of claims reviewers typically need to verify orally.",
                        referenced_sources=[],
                        model_confidence=0.91 - (order * 0.03),
                        signals=["family-template", "reviewer-first"],
                    ),
                )
            )
        return goals

    def _artifact_source_ref(self, artifact: Artifact) -> SourceRef:
        excerpt = artifact.extracted_text[:180]
        return SourceRef(
            artifact_id=artifact.id,
            label=artifact.file_name,
            section_title=artifact.extracted_structure[0].title if artifact.extracted_structure else None,
            locator="Artifact preview",
            excerpt=excerpt,
            kind=SourceKind.ASSIGNMENT,
            score=artifact.role_confidence,
        )

    def _focus_templates_for_family(self, family: AssignmentFamily) -> list[dict]:
        return {
            AssignmentFamily.REPORT_ESSAY: [
                {"label": "Core Argument Rationale", "description": "How the student chose and shaped the central claim.", "why": "This reveals whether the written argument is genuinely understood.", "goals": ["goal_reasoning_depth", "goal_ownership"]},
                {"label": "Evidence Interpretation", "description": "How evidence was selected, weighted, and connected to the conclusion.", "why": "This tests whether the student can defend claims beyond surface citation.", "goals": ["goal_evidence_interpretation"]},
                {"label": "Limitation Handling", "description": "How uncertainty, counterpoints, or methodological limits were handled.", "why": "This helps reviewers distinguish genuine understanding from polished prose.", "goals": ["goal_limitation_awareness"]},
                {"label": "Recommendation Ownership", "description": "How the final recommendation was derived from the report’s reasoning chain.", "why": "This probes whether the recommendation is the student’s own synthesis.", "goals": ["goal_ownership"]},
            ],
            AssignmentFamily.PRESENTATION_SLIDES: [
                {"label": "Narrative Choice", "description": "Why the deck opens and builds in the chosen order.", "why": "Strategic decks are strongest when the narrative logic is defendable, not just the slides.", "goals": ["goal_strategic_clarity"]},
                {"label": "Priority Tradeoff", "description": "How the student prioritized one direction over alternatives.", "why": "Tradeoff defense distinguishes genuine strategy thinking from surface recommendation.", "goals": ["goal_tradeoff_reasoning"]},
                {"label": "Evidence Signal", "description": "Which slide or note carries the most important support for the recommendation.", "why": "This checks whether the deck is anchored in evidence rather than formatting polish.", "goals": ["goal_evidence_signal"]},
                {"label": "Storyline Ownership", "description": "How the student assembled and refined the recommendation narrative.", "why": "This helps reviewers assess authentic authorship of the presentation.", "goals": ["goal_ownership"]},
            ],
            AssignmentFamily.TECHNICAL_NOTEBOOK: [
                {"label": "Method Chain", "description": "How the student sequenced the analysis from raw data to conclusion.", "why": "This surfaces whether the notebook is truly understood rather than merely executed.", "goals": ["goal_method_understanding"]},
                {"label": "Assumption Awareness", "description": "What assumptions, cleaning choices, or caveats were most material.", "why": "Strong technical work includes explicit ownership of uncertainty.", "goals": ["goal_data_quality"]},
                {"label": "Result Interpretation", "description": "How the student translated outputs into claims without overstating certainty.", "why": "Reviewers need to know whether interpretation is disciplined and grounded.", "goals": ["goal_interpretation"]},
                {"label": "Implementation Ownership", "description": "Which analytical step best demonstrates the student’s own reasoning and decisions.", "why": "This helps verify real authorship of the technical workflow.", "goals": ["goal_ownership"]},
            ],
            AssignmentFamily.MIXED_SUBMISSION: [
                {"label": "Cross-Artifact Synthesis", "description": "How the student connected different files into one coherent argument.", "why": "Mixed submissions are only convincing when the pieces reinforce each other.", "goals": ["goal_synthesis"]},
                {"label": "Evidence Selection", "description": "Which artifact carries the core support and why.", "why": "This shows whether the student understands the evidentiary center of the bundle.", "goals": ["goal_evidence"]},
                {"label": "Decision Tradeoff", "description": "What tradeoff shaped the final submission bundle.", "why": "Tradeoffs are often the clearest window into genuine authorship.", "goals": ["goal_tradeoffs"]},
                {"label": "Bundle Ownership", "description": "How the student personally shaped the final combination of artifacts.", "why": "This checks authentic ownership of the integrated work product.", "goals": ["goal_ownership"]},
            ],
        }[family]

    def _risk_profile(self, student_identifier: str) -> str:
        value = stable_hash(student_identifier) % 100
        if value < 38:
            return "low"
        if value < 74:
            return "medium"
        return "high"

    def _summary_from_transcript(self, transcript: str, focus_label: str) -> str:
        stripped = transcript.strip()
        if not stripped:
            return f"The student did not provide a usable explanation for `{focus_label}`."
        sentence = stripped.split(".")[0].strip()
        if len(sentence) < 40:
            return f"The student gave a short explanation for `{focus_label}`, but the rationale stayed compressed."
        return sentence + "."

    def _quality_score(self, response: CaseResponse) -> float:
        if not response.summary:
            return 0.5
        quality = response.summary["evidenceQuality"] if isinstance(response.summary, dict) else response.summary.evidence_quality
        return {
            EvidenceQuality.STRONG.value: 0.9,
            EvidenceQuality.MEDIUM.value: 0.68,
            EvidenceQuality.WEAK.value: 0.42,
        }[quality]

    def _has_inconsistency_signal(self, response: CaseResponse) -> bool:
        if not response.summary:
            return False
        signals = response.summary["signals"] if isinstance(response.summary, dict) else response.summary.signals
        return "vague" in signals or "brief" in signals

    def _build_executive_summary(
        self,
        case: Case,
        priority: ReviewPriority,
        focus_reviews: list[FocusPointReview],
        inconsistencies: list[dict],
    ) -> str:
        verified = sum(1 for item in focus_reviews if item.status == FocusPointState.VERIFIED)
        unclear = sum(1 for item in focus_reviews if item.status in {FocusPointState.UNCLEAR, FocusPointState.NEEDS_FOLLOW_UP})
        tone = {
            ReviewPriority.LOW: "The oral responses broadly reinforce the written submission.",
            ReviewPriority.MEDIUM: "The oral responses support the core of the submission, but several areas remained thinner than the written work.",
            ReviewPriority.HIGH: "The oral responses left material verification gaps relative to the most important written claims.",
        }[priority]
        return (
            f"{tone} Concentra verified {verified} focus points clearly and identified {unclear} areas that still need closer reviewer attention. "
            f"The case currently carries {len(inconsistencies)} neutral inconsistency flags, which can guide a faster but grounded final judgment."
        )
