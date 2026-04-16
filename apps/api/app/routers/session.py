from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_service
from app.models.api import SubmitResponseRequest, UploadUrlRequest
from app.services.concentra import ConcentraService

router = APIRouter(prefix="/api", tags=["session"])


@router.get("/session/{token_value}")
def get_session(token_value: str, service: ConcentraService = Depends(get_service)) -> dict:
    return service.get_session(token_value)


@router.post("/session/{token_value}/start")
def start_session(token_value: str, service: ConcentraService = Depends(get_service)) -> dict:
    return service.start_session(token_value)


@router.post("/session/{token_value}/upload-response-url")
def response_upload_url(
    token_value: str,
    payload: UploadUrlRequest,
    service: ConcentraService = Depends(get_service),
) -> dict:
    return service.create_session_response_upload_target(token_value, payload)


@router.post("/session/{token_value}/submit-response")
def submit_response(
    token_value: str,
    payload: SubmitResponseRequest,
    service: ConcentraService = Depends(get_service),
) -> dict:
    return service.submit_response(
        token_value,
        payload.question_id,
        payload.audio_path,
        payload.video_path,
        payload.duration_seconds,
    )


@router.post("/session/{token_value}/complete")
def complete_session(token_value: str, service: ConcentraService = Depends(get_service)) -> dict:
    return service.complete_session(token_value)
