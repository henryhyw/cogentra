import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from oralv.api.deps import AuthContext, require_auth, require_csrf
from oralv.db import get_db
from oralv.models import ArtifactKind, DefensePlan, ParsedArtifact
from oralv.schemas.cases import CreateCaseRequest, ReclassifyArtifactRequest
from oralv.schemas.common import ArtifactSummary, CaseSummary, ParsedArtifactSummary, SubmissionSummary
from oralv.services import cases as case_service
from oralv.storage import StorageClient

router = APIRouter()


@router.get("")
def list_cases(context: AuthContext = Depends(require_auth), db: Session = Depends(get_db)):
    cases = case_service.list_cases(db, context.organization_id)
    return {"cases": [CaseSummary.model_validate(item) for item in cases]}


@router.post("", dependencies=[Depends(require_csrf)])
def create_case(
    body: CreateCaseRequest,
    context: AuthContext = Depends(require_auth),
    db: Session = Depends(get_db),
):
    case = case_service.create_case(
        db,
        organization_id=context.organization_id,
        created_by_user_id=context.user.id,
        title=body.title,
        description=body.description,
        course_name=body.course_name,
        assignment_family=body.assignment_family,
        template_id=body.template_id,
    )
    return {"case": CaseSummary.model_validate(case)}


@router.get("/{case_id}")
def get_case(case_id: str, context: AuthContext = Depends(require_auth), db: Session = Depends(get_db)):
    bundle = case_service.get_case_bundle(db, case_id)
    if not bundle["case"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    storage = StorageClient()
    parsed = (
        db.query(ParsedArtifact)
        .filter(ParsedArtifact.case_id == case_id)
        .order_by(ParsedArtifact.created_at.asc())
        .all()
    )
    return {
        "case": CaseSummary.model_validate(bundle["case"]),
        "artifacts": [
            {
                **ArtifactSummary.model_validate(item).model_dump(),
                "signed_url": storage.signed_get_url(item.storage_key),
            }
            for item in bundle["artifacts"]
        ],
        "parsed_artifacts": [ParsedArtifactSummary.model_validate(item) for item in parsed],
        "submissions": [SubmissionSummary.model_validate(item) for item in bundle["submissions"]],
    }


@router.post("/{case_id}/artifacts", dependencies=[Depends(require_csrf)])
def upload_artifacts(
    case_id: str,
    files: list[UploadFile] = File(...),
    kind_overrides: str | None = Form(default=None),
    context: AuthContext = Depends(require_auth),
    db: Session = Depends(get_db),
):
    overrides = json.loads(kind_overrides) if kind_overrides else {}
    artifacts = case_service.upload_artifacts(
        db,
        organization_id=context.organization_id,
        case_id=case_id,
        files=files,
        kind_overrides=overrides,
    )
    return {"artifacts": [ArtifactSummary.model_validate(item) for item in artifacts]}


@router.post("/{case_id}/process", dependencies=[Depends(require_csrf)])
def process_case(case_id: str, context: AuthContext = Depends(require_auth), db: Session = Depends(get_db)):
    return case_service.process_case(db, case_id)


@router.post("/artifacts/{artifact_id}/classify", dependencies=[Depends(require_csrf)])
def reclassify_artifact(
    artifact_id: str,
    body: ReclassifyArtifactRequest,
    context: AuthContext = Depends(require_auth),
    db: Session = Depends(get_db),
):
    artifact = case_service.reclassify_artifact(db, artifact_id=artifact_id, kind=body.kind)
    return {"artifact": ArtifactSummary.model_validate(artifact)}


@router.get("/{case_id}/plans")
def case_plans(case_id: str, context: AuthContext = Depends(require_auth), db: Session = Depends(get_db)):
    plans = db.query(DefensePlan).filter(DefensePlan.case_id == case_id).order_by(DefensePlan.created_at.asc()).all()
    return {
        "plans": [
            {
                "id": str(plan.id),
                "submission_record_id": str(plan.submission_record_id),
                "status": plan.status.value,
                "version_number": plan.version_number,
                "focus_graph_json": plan.focus_graph_json,
                "plan_json": plan.plan_json,
                "settings_json": plan.settings_json,
            }
            for plan in plans
        ]
    }
