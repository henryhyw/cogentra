from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import HTTPException, Response, status
from sqlalchemy.orm import Session

from oralv.config import get_settings
from oralv.models import AuthSession, InviteToken, Organization, OrganizationMembership, RoleType, User
from oralv.security import digest_token, generate_token, hash_password, new_session_expiry, verify_password
from oralv.services.audit import log_event
from oralv.services.rate_limit import ensure_allowed


def _slugify(name: str) -> str:
    cleaned = "".join(char.lower() if char.isalnum() else "-" for char in name)
    cleaned = "-".join(segment for segment in cleaned.split("-") if segment)
    return cleaned[:80] or "org"


def _build_session(db: Session, user: User, organization_id: UUID, response: Response) -> dict[str, Any]:
    settings = get_settings()
    token = generate_token("sess")
    csrf = generate_token("csrf")
    auth_session = AuthSession(
        organization_id=organization_id,
        user_id=user.id,
        session_hash=digest_token(token),
        csrf_token=csrf,
        expires_at=new_session_expiry(),
        last_seen_at=datetime.now(UTC),
    )
    db.add(auth_session)
    db.flush()
    response.set_cookie(
        settings.session_cookie_name,
        token,
        httponly=True,
        samesite="lax",
        secure=False,
    )
    response.set_cookie(
        settings.csrf_cookie_name,
        csrf,
        httponly=False,
        samesite="lax",
        secure=False,
    )
    return {"session_id": str(auth_session.id), "csrf_token": csrf}


def signup(
    db: Session,
    *,
    full_name: str,
    email: str,
    password: str,
    organization_name: str,
    response: Response,
) -> dict[str, Any]:
    ensure_allowed(f"auth:signup:{email}", limit=10, window_seconds=3600)
    existing = db.query(User).filter(User.email == email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    slug_base = _slugify(organization_name)
    slug = slug_base
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        counter += 1
        slug = f"{slug_base}-{counter}"

    user = User(email=email.lower(), full_name=full_name, hashed_password=hash_password(password))
    organization = Organization(name=organization_name, slug=slug, onboarding_state={"completed": False})
    db.add_all([user, organization])
    db.flush()
    membership = OrganizationMembership(
        organization_id=organization.id,
        user_id=user.id,
        role=RoleType.owner,
        title="Founding reviewer",
    )
    db.add(membership)
    payload = _build_session(db, user, organization.id, response)
    log_event(
        db,
        organization_id=organization.id,
        event_type="auth.signup",
        entity_type="user",
        entity_id=str(user.id),
        actor_type="user",
        user_id=user.id,
    )
    db.commit()
    return {
        "user": user,
        "organization": organization,
        "membership": membership,
        "session": payload,
    }


def login(db: Session, *, email: str, password: str, response: Response) -> dict[str, Any]:
    ensure_allowed(f"auth:login:{email}", limit=15, window_seconds=900)
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    membership = (
        db.query(OrganizationMembership)
        .filter(OrganizationMembership.user_id == user.id)
        .order_by(OrganizationMembership.created_at.asc())
        .first()
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No organization membership")
    user.last_login_at = datetime.now(UTC)
    payload = _build_session(db, user, membership.organization_id, response)
    log_event(
        db,
        organization_id=membership.organization_id,
        event_type="auth.login",
        entity_type="user",
        entity_id=str(user.id),
        actor_type="user",
        user_id=user.id,
    )
    db.commit()
    organization = db.query(Organization).filter(Organization.id == membership.organization_id).first()
    return {"user": user, "organization": organization, "membership": membership, "session": payload}


def logout(db: Session, *, session_hash: str | None, response: Response) -> None:
    settings = get_settings()
    if session_hash:
        auth_session = db.query(AuthSession).filter(AuthSession.session_hash == session_hash).first()
        if auth_session:
            db.delete(auth_session)
            db.commit()
    response.delete_cookie(settings.session_cookie_name)
    response.delete_cookie(settings.csrf_cookie_name)


def invite_member(
    db: Session,
    *,
    organization_id: UUID,
    invited_by_user_id: UUID,
    email: str,
    role: RoleType,
) -> dict[str, Any]:
    ensure_allowed(f"invite:{organization_id}:{email.lower()}", limit=20, window_seconds=3600)
    raw_token = generate_token("invite")
    invite = InviteToken(
        organization_id=organization_id,
        invited_by_user_id=invited_by_user_id,
        email=email.lower(),
        role=role,
        token_hash=digest_token(raw_token),
        expires_at=new_session_expiry(72),
    )
    db.add(invite)
    db.flush()
    log_event(
        db,
        organization_id=organization_id,
        event_type="member.invited",
        entity_type="invite_token",
        entity_id=str(invite.id),
        actor_type="user",
        user_id=invited_by_user_id,
        payload={"email": email.lower(), "role": role.value},
    )
    db.commit()
    return {"invite": invite, "invite_url": f"{get_settings().base_url}/invite/{raw_token}"}
