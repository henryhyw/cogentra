from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_bearer_token, get_service
from app.models.api import DemoLoginRequest
from app.services.concentra import ConcentraService

router = APIRouter(prefix="/api", tags=["auth"])


@router.get("/me")
def get_me(service: ConcentraService = Depends(get_service), token: str | None = Depends(get_bearer_token)) -> dict:
    return service.get_me(token)


@router.post("/demo-login")
def demo_login(
    payload: DemoLoginRequest,
    service: ConcentraService = Depends(get_service),
) -> dict:
    return service.demo_login(payload.email).model_dump(by_alias=True)
