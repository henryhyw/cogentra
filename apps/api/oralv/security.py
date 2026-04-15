import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher

from oralv.config import get_settings

password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return password_hasher.verify(hashed, password)
    except Exception:
        return False


def generate_token(prefix: str = "ov") -> str:
    return f"{prefix}_{secrets.token_urlsafe(24)}"


def digest_token(value: str) -> str:
    settings = get_settings()
    return hmac.new(settings.signing_secret.encode(), value.encode(), hashlib.sha256).hexdigest()


def new_session_expiry(hours: int = 12) -> datetime:
    return datetime.now(UTC) + timedelta(hours=hours)
