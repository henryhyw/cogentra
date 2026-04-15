import uuid
from typing import Any

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from oralv.models import Artifact, ArtifactKind, ArtifactStatus, AssessmentCase, CaseStatus, SubmissionRecord
from oralv.services.audit import log_event
from oralv.services.pipeline import classify_artifact, process_case_ingestion
from oralv.storage import StorageClient


def list_cases(db: Session, organization_id) -> list[AssessmentCase]:
    return (
        db.query(AssessmentCase)
        .filter(AssessmentCase.organization_id == organization_id, AssessmentCase.deleted_at.is_(None))
        .order_by(AssessmentCase.created_at.desc())
        .all()
    )


def create_case(
    db: Session,
    *,
    organization_id,
    created_by_user_id,
    title: str,
    description: str | None,
    course_name: str | None,
    assignment_family,
    template_id=None,
) -> AssessmentCase:
    case = AssessmentCase(
        organization_id=organization_id,
        created_by_user_id=created_by_user_id,
        template_id=template_id,
        title=title,
        description=description,
        course_name=course_name,
        assignment_family=assignment_family,
        status=CaseStatus.draft,
    )
    db.add(case)
    db.flush()
    log_event(
        db,
        organization_id=organization_id,
        event_type="case.created",
        entity_type="assessment_case",
        entity_id=str(case.id),
        actor_type="user",
        user_id=created_by_user_id,
        case_id=case.id,
    )
    db.commit()
    return case


def upload_artifacts(
    db: Session,
    *,
    organization_id,
    case_id,
    files: list[UploadFile],
    kind_overrides: dict[str, str] | None = None,
) -> list[Artifact]:
    storage = StorageClient()
    artifacts: list[Artifact] = []
    kind_overrides = kind_overrides or {}
    for upload in files:
        filename = upload.filename or "upload.bin"
        data = upload.file.read()
        object_name = f"cases/{case_id}/{uuid.uuid4().hex}-{filename}"
        storage.upload_bytes(object_name, data, upload.content_type or "application/octet-stream")
        inferred_kind, confidence = classify_artifact(filename, upload.content_type or "")
        final_kind = ArtifactKind(kind_overrides.get(filename, inferred_kind.value))
        artifact = Artifact(
            organization_id=organization_id,
            case_id=case_id,
            kind=final_kind,
            status=ArtifactStatus.uploaded,
            filename=filename,
            content_type=upload.content_type or "application/octet-stream",
            storage_key=object_name,
            byte_size=len(data),
            source_label="uploaded",
            classification_confidence=confidence,
            metadata_json={"size": len(data)},
        )
        db.add(artifact)
        artifacts.append(artifact)
    db.flush()
    case = db.query(AssessmentCase).filter(AssessmentCase.id == case_id).first()
    if case:
        case.status = CaseStatus.draft
    log_event(
        db,
        organization_id=organization_id,
        event_type="artifact.uploaded",
        entity_type="assessment_case",
        entity_id=str(case_id),
        actor_type="user",
        case_id=case_id,
        payload={"count": len(artifacts)},
    )
    db.commit()
    return artifacts


def reclassify_artifact(db: Session, *, artifact_id, kind: ArtifactKind) -> Artifact:
    artifact = db.query(Artifact).filter(Artifact.id == artifact_id).first()
    if not artifact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")
    artifact.kind = kind
    artifact.classification_confidence = 1.0
    db.commit()
    return artifact


def get_case_bundle(db: Session, case_id) -> dict[str, Any]:
    case = db.query(AssessmentCase).filter(AssessmentCase.id == case_id).first()
    artifacts = (
        db.query(Artifact)
        .filter(Artifact.case_id == case_id, Artifact.deleted_at.is_(None))
        .order_by(Artifact.created_at.asc())
        .all()
    )
    submissions = (
        db.query(SubmissionRecord)
        .filter(SubmissionRecord.case_id == case_id, SubmissionRecord.deleted_at.is_(None))
        .order_by(SubmissionRecord.queue_position.asc())
        .all()
    )
    return {"case": case, "artifacts": artifacts, "submissions": submissions}


def process_case(db: Session, case_id: str) -> dict[str, Any]:
    return process_case_ingestion(db, case_id)
