from fastapi import HTTPException, status
from redis import Redis

from oralv.config import get_settings


def ensure_allowed(key: str, limit: int, window_seconds: int) -> None:
    settings = get_settings()
    redis_client = Redis.from_url(settings.redis_url)
    current = redis_client.incr(key)
    if current == 1:
        redis_client.expire(key, window_seconds)
    if current > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
        )
