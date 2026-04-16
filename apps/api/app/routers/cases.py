from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_bearer_token, get_service
from app.models.api import ReviewNoteRequest
from app.services.concentra import ConcentraService

router = APIRouter(prefix="/api", tags=["cases"])


@router.get("/cases/{case_id}")
def get_case(
    case_id: str,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.get_case(case_id, token)


@router.post("/cases/{case_id}/regenerate-session-link")
def regenerate_session_link(
    case_id: str,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.regenerate_session_link(case_id, token)


@router.post("/cases/{case_id}/refresh-analysis")
def refresh_analysis(
    case_id: str,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.refresh_case_analysis(case_id, token)


@router.get("/cases/{case_id}/result")
def get_result(
    case_id: str,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.get_result(case_id, token)


@router.patch("/cases/{case_id}/review-note")
def update_review_note(
    case_id: str,
    payload: ReviewNoteRequest,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.update_review_note(case_id, payload, token)


@router.post("/cases/{case_id}/mark-reviewed")
def mark_reviewed(
    case_id: str,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.mark_reviewed(case_id, token)
