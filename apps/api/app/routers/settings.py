from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_bearer_token, get_service
from app.models.api import UpdateSettingsRequest
from app.services.concentra import ConcentraService

router = APIRouter(prefix="/api", tags=["settings"])


@router.get("/settings")
def get_settings(service: ConcentraService = Depends(get_service), token: str | None = Depends(get_bearer_token)) -> dict:
    return service.get_settings(token).model_dump(by_alias=True)


@router.patch("/settings")
def update_settings(
    payload: UpdateSettingsRequest,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.update_settings(payload, token).model_dump(by_alias=True)
