from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from oralv.api.deps import AuthContext, require_auth, require_csrf
from oralv.config import get_settings
from oralv.db import get_db
from oralv.schemas.auth import LoginRequest, SignupRequest
from oralv.services import auth as auth_service
from oralv.schemas.common import MembershipSummary, OrganizationSummary, UserSummary

router = APIRouter()


def _serialize_auth_payload(payload):
    return {
        "user": UserSummary.model_validate(payload["user"]),
        "organization": OrganizationSummary.model_validate(payload["organization"]),
        "membership": MembershipSummary.model_validate({
            "id": payload["membership"].id,
            "role": payload["membership"].role,
            "title": payload["membership"].title,
            "organization": payload["organization"],
            "user": payload["user"],
        }),
        "session": payload["session"],
    }


@router.post("/signup")
def signup(body: SignupRequest, response: Response, db: Session = Depends(get_db)):
    return _serialize_auth_payload(
        auth_service.signup(
            db,
            full_name=body.full_name,
            email=body.email,
            password=body.password,
            organization_name=body.organization_name,
            response=response,
        )
    )


@router.post("/login")
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    return _serialize_auth_payload(
        auth_service.login(db, email=body.email, password=body.password, response=response)
    )


@router.post("/logout", dependencies=[Depends(require_csrf)])
def logout(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
    _: AuthContext = Depends(require_auth),
):
    session_cookie = request.cookies.get(get_settings().session_cookie_name)
    from oralv.security import digest_token

    auth_service.logout(db, session_hash=digest_token(session_cookie) if session_cookie else None, response=response)
    return {"message": "Logged out"}


@router.get("/me")
def me(context: AuthContext = Depends(require_auth)):
    return {
        "user": UserSummary.model_validate(context.user),
        "organization_id": context.organization_id,
        "role": context.membership.role.value,
        "csrf_token": context.session.csrf_token,
    }
