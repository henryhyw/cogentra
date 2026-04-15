from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from oralv.api.deps import AuthContext, require_auth, require_csrf
from oralv.db import get_db
from oralv.schemas.cases import CreateTemplateRequest
from oralv.services import templates as template_service

router = APIRouter()


@router.get("")
def list_templates(context: AuthContext = Depends(require_auth), db: Session = Depends(get_db)):
    templates = template_service.list_templates(db, context.organization_id)
    return {
        "templates": [
            {
                "id": str(template.id),
                "title": template.title,
                "description": template.description,
                "assignment_family": template.assignment_family.value,
                "created_at": template.created_at,
            }
            for template in templates
        ]
    }


@router.post("/from-case/{case_id}", dependencies=[Depends(require_csrf)])
def create_from_case(
    case_id: str,
    body: CreateTemplateRequest,
    context: AuthContext = Depends(require_auth),
    db: Session = Depends(get_db),
):
    template = template_service.create_template_from_case(
        db,
        organization_id=context.organization_id,
        case_id=case_id,
        created_by_user_id=context.user.id,
        title=body.title,
    )
    return {"template_id": str(template.id)}
