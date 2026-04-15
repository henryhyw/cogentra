from collections.abc import Callable
from dataclasses import dataclass
from uuid import UUID

from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from oralv.config import get_settings
from oralv.db import get_db
from oralv.models import AuthSession, OrganizationMembership, RoleType, User


@dataclass
class AuthContext:
    user: User
    organization_id: UUID
    membership: OrganizationMembership
    session: AuthSession


def require_csrf(
    request: Request,
    csrf_cookie: str | None = Cookie(default=None, alias=get_settings().csrf_cookie_name),
    csrf_header: str | None = Header(default=None, alias="x-csrf-token"),
) -> None:
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return
    if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")


def require_auth(
    db: Session = Depends(get_db),
    session_cookie: str | None = Cookie(default=None, alias=get_settings().session_cookie_name),
) -> AuthContext:
    from oralv.security import digest_token

    if not session_cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing session")

    auth_session = (
        db.query(AuthSession).filter(AuthSession.session_hash == digest_token(session_cookie)).first()
    )
    if not auth_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    user = db.query(User).filter(User.id == auth_session.user_id).first()
    membership = (
        db.query(OrganizationMembership)
        .filter(
            OrganizationMembership.organization_id == auth_session.organization_id,
            OrganizationMembership.user_id == auth_session.user_id,
        )
        .first()
    )
    if not user or not membership:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid membership")

    return AuthContext(
        user=user,
        organization_id=auth_session.organization_id,
        membership=membership,
        session=auth_session,
    )


def require_role(*allowed: RoleType) -> Callable[[AuthContext], AuthContext]:
    def _inner(context: AuthContext = Depends(require_auth)) -> AuthContext:
        if context.membership.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return context

    return _inner
