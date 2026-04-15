from pydantic import BaseModel

from oralv.models.entities import DecisionVerdict


class DecisionRequest(BaseModel):
    verdict: DecisionVerdict
    summary: str
    reviewer_note: str | None = None
