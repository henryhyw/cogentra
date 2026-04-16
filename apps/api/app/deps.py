from __future__ import annotations

from functools import lru_cache

from fastapi import Header

from app.config import Settings, get_settings
from app.services.concentra import ConcentraService


@lru_cache(maxsize=1)
def get_service() -> ConcentraService:
    return ConcentraService(get_settings())


def get_bearer_token(authorization: str | None = Header(default=None)) -> str | None:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1]
    return authorization


def get_app_settings() -> Settings:
    return get_settings()
