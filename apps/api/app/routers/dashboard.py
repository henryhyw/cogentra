from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_bearer_token, get_service
from app.services.concentra import ConcentraService

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
def get_dashboard(service: ConcentraService = Depends(get_service), token: str | None = Depends(get_bearer_token)) -> dict:
    return service.get_dashboard(token).model_dump(by_alias=True)
