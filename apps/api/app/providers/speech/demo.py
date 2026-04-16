from __future__ import annotations

from app.models.domain import AssignmentFamily, Case, GeneratedQuestion
from app.providers.speech.base import SpeechProvider, TranscriptionResult
from app.services.text import stable_hash


class DemoSpeechProvider(SpeechProvider):
    def transcribe(self, *, case: Case, question: GeneratedQuestion, audio_path: str) -> TranscriptionResult:
        risk = self._risk_profile(case.student_identifier)
        transcript = self._transcript_for(case.family if hasattr(case, "family") else case.submission_family, question, risk)
        confidence = {"low": 0.97, "medium": 0.92, "high": 0.87}[risk]
        return TranscriptionResult(
            transcript_text=transcript,
            confidence=confidence,
            signals=[risk, "deterministic-demo", "question-aware"],
        )

    def _risk_profile(self, student_identifier: str) -> str:
        score = stable_hash(student_identifier) % 100
        if score < 38:
            return "low"
        if score < 74:
            return "medium"
        return "high"

    def _transcript_for(self, family: AssignmentFamily, question: GeneratedQuestion, risk: str) -> str:
        focus = question.focus_label.lower()
        detailed_openers = {
            AssignmentFamily.REPORT_ESSAY: "I structured that section around the evidence trail in the report rather than around the final recommendation.",
            AssignmentFamily.PRESENTATION_SLIDES: "I sequenced the slide to show the market tension first because the recommendation only makes sense once the audience sees the adoption constraint.",
            AssignmentFamily.TECHNICAL_NOTEBOOK: "I kept the notebook split between exploration and final analysis so I could defend the modeling choices in a reproducible way.",
            AssignmentFamily.MIXED_SUBMISSION: "I combined the written explanation with the supporting material so the reasoning and the visual proof stayed connected.",
        }
        medium_openers = {
            AssignmentFamily.REPORT_ESSAY: "I remember the reasoning, although I do not have every figure memorized.",
            AssignmentFamily.PRESENTATION_SLIDES: "The direction was intentional, even if I would probably tighten some of the slide language now.",
            AssignmentFamily.TECHNICAL_NOTEBOOK: "I can explain the approach, but I may not recall every implementation detail in sequence.",
            AssignmentFamily.MIXED_SUBMISSION: "The parts were meant to reinforce each other, though some of the wording was fairly concise.",
        }
        high_openers = {
            AssignmentFamily.REPORT_ESSAY: "I followed the report structure, but I am less certain about the exact support for that point.",
            AssignmentFamily.PRESENTATION_SLIDES: "I knew the direction I wanted, but I am not fully sure I can restate all of the tradeoffs clearly now.",
            AssignmentFamily.TECHNICAL_NOTEBOOK: "I remember the broad workflow more than the exact reasons for each analytical step.",
            AssignmentFamily.MIXED_SUBMISSION: "I can describe the overall idea, although some of the detailed choices are fuzzy now.",
        }
        middle = {
            "method": "The main method choice came from the constraints in the assignment, and I chose the version that kept the assumptions visible instead of hiding them in a polished conclusion.",
            "evidence": "I relied on the strongest section-level evidence rather than summarizing the whole submission, because that is what the reviewer would need to challenge first.",
            "limitation": "The limitation I was most aware of was that one part of the source material is directional rather than definitive, so I framed it as a qualified claim.",
            "ownership": "That part was my own work product, including the framing and the explanation of why the tradeoff mattered in this case.",
            "default": "I made that decision because it was the most defensible way to connect the submission to the rubric without overstating certainty.",
        }
        key = next((name for name in middle if name in focus), "default")
        closer = {
            "low": "If I had a follow-up, I would point back to the same source section because it is where the reasoning is most explicit.",
            "medium": "I could probably tighten the explanation in one pass, but the underlying reasoning is still the same.",
            "high": "I would need to look back at the submission to confirm the exact detail I used there.",
        }[risk]
        opening = {
            "low": detailed_openers[family],
            "medium": medium_openers[family],
            "high": high_openers[family],
        }[risk]
        return " ".join([opening, middle[key], closer])
