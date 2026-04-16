from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SessionCompletionState:
    required_answer_count: int
    submitted_answer_count: int
    answered_question_ids: tuple[str, ...]
    missing_question_ids: tuple[str, ...]

    @property
    def can_complete(self) -> bool:
        return self.required_answer_count > 0 and not self.missing_question_ids

    def as_payload(self) -> dict:
        return {
            "requiredAnswerCount": self.required_answer_count,
            "submittedAnswerCount": self.submitted_answer_count,
            "answeredQuestionIds": list(self.answered_question_ids),
            "missingQuestionIds": list(self.missing_question_ids),
            "canComplete": self.can_complete,
        }


def build_session_completion_state(questions: list[dict], responses: list[dict]) -> SessionCompletionState:
    question_ids = [str(question["id"]) for question in questions]
    answered_ids = {str(response["questionId"]) for response in responses}
    missing_ids = tuple(question_id for question_id in question_ids if question_id not in answered_ids)
    ordered_answered = tuple(question_id for question_id in question_ids if question_id in answered_ids)
    return SessionCompletionState(
        required_answer_count=len(question_ids),
        submitted_answer_count=len(ordered_answered),
        answered_question_ids=ordered_answered,
        missing_question_ids=missing_ids,
    )
