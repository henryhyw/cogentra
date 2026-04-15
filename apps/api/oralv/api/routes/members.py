from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from oralv.api.deps import AuthContext, require_auth, require_csrf, require_role
from oralv.db import get_db
from oralv.models import InviteToken, OrganizationMembership, Organization, User, RoleType
from oralv.schemas.auth import InviteRequest
from oralv.services.auth import invite_member

router = APIRouter()


@router.get("")
def list_members(context: AuthContext = Depends(require_auth), db: Session = Depends(get_db)):
    memberships = (
        db.query(OrganizationMembership, User, Organization)
        .join(User, OrganizationMembership.user_id == User.id)
        .join(Organization, OrganizationMembership.organization_id == Organization.id)
        .filter(OrganizationMembership.organization_id == context.organization_id)
        .all()
    )
    invites = (
        db.query(InviteToken)
        .filter(InviteToken.organization_id == context.organization_id)
        .order_by(InviteToken.created_at.desc())
        .all()
    )
    return {
        "members": [
            {
                "id": str(membership.id),
                "role": membership.role.value,
                "title": membership.title,
                "email": user.email,
                "full_name": user.full_name,
                "organization_name": organization.name,
            }
            for membership, user, organization in memberships
        ],
        "invites": [
            {
                "id": str(invite.id),
                "email": invite.email,
                "role": invite.role.value,
                "expires_at": invite.expires_at,
                "redeemed_at": invite.redeemed_at,
            }
            for invite in invites
        ],
    }


@router.post("/invite", dependencies=[Depends(require_csrf)])
def create_invite(
    body: InviteRequest,
    context: AuthContext = Depends(require_role(RoleType.owner, RoleType.admin)),
    db: Session = Depends(get_db),
):
    return invite_member(
        db,
        organization_id=context.organization_id,
        invited_by_user_id=context.user.id,
        email=body.email,
        role=body.role,
    )
