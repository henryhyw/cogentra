from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_bearer_token, get_service
from app.models.api import (
    AnalyzeArtifactsRequest,
    CreateAssignmentRequest,
    FixMappingRequest,
    RegisterArtifactRequest,
    RegisterImportBatchRequest,
    UpdateAssignmentRequest,
    UploadUrlRequest,
)
from app.services.concentra import ConcentraService

router = APIRouter(prefix="/api", tags=["assignments"])


@router.get("/assignments")
def list_assignments(service: ConcentraService = Depends(get_service), token: str | None = Depends(get_bearer_token)) -> list[dict]:
    return [item.model_dump(by_alias=True) for item in service.list_assignments(token)]


@router.post("/assignments")
def create_assignment(
    payload: CreateAssignmentRequest,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.create_assignment(payload, token)


@router.get("/assignments/{assignment_id}")
def get_assignment(
    assignment_id: str,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.get_assignment(assignment_id, token)


@router.patch("/assignments/{assignment_id}")
def patch_assignment(
    assignment_id: str,
    payload: UpdateAssignmentRequest,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.update_assignment(assignment_id, payload, token)


@router.delete("/assignments/{assignment_id}")
def delete_assignment(
    assignment_id: str,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.archive_assignment(assignment_id, token)


@router.post("/assignments/{assignment_id}/artifacts/upload-url")
def artifact_upload_url(
    assignment_id: str,
    payload: UploadUrlRequest,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.create_assignment_artifact_upload_target(assignment_id, payload, token)


@router.post("/assignments/{assignment_id}/artifacts/register")
def register_assignment_artifact(
    assignment_id: str,
    payload: RegisterArtifactRequest,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.register_assignment_artifact(assignment_id, payload, token)


@router.get("/assignments/{assignment_id}/artifacts")
def list_assignment_artifacts(
    assignment_id: str,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> list[dict]:
    return service.list_assignment_artifacts(assignment_id, token)


@router.patch("/assignments/{assignment_id}/artifacts/{artifact_id}")
def patch_assignment_artifact(
    assignment_id: str,
    artifact_id: str,
    payload: dict,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.update_assignment_artifact(assignment_id, artifact_id, payload, token)


@router.post("/assignments/{assignment_id}/artifacts/analyze")
def analyze_assignment_artifacts(
    assignment_id: str,
    payload: AnalyzeArtifactsRequest,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    _ = payload
    return service.analyze_assignment_artifacts(assignment_id, token)


@router.post("/assignments/{assignment_id}/imports/upload-url")
def import_upload_url(
    assignment_id: str,
    payload: UploadUrlRequest,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.create_import_upload_target(assignment_id, payload, token)


@router.post("/assignments/{assignment_id}/imports/register-batch")
def register_import_batch(
    assignment_id: str,
    payload: RegisterImportBatchRequest,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.register_import_batch(assignment_id, payload, token)


@router.get("/assignments/{assignment_id}/imports/{import_id}")
def get_import(
    assignment_id: str,
    import_id: str,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.get_import(assignment_id, import_id, token)


@router.post("/assignments/{assignment_id}/imports/{import_id}/analyze")
def analyze_import(
    assignment_id: str,
    import_id: str,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.analyze_import(assignment_id, import_id, token)


@router.patch("/assignments/{assignment_id}/imports/{import_id}/fix-mapping")
def fix_mapping(
    assignment_id: str,
    import_id: str,
    payload: FixMappingRequest,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.fix_import_mapping(
        assignment_id,
        import_id,
        payload.import_item_id,
        payload.matched_student_identifier,
        payload.bundle_id,
        token,
    )


@router.post("/assignments/{assignment_id}/imports/{import_id}/create-cases")
def create_cases_from_import(
    assignment_id: str,
    import_id: str,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> dict:
    return service.create_cases_from_import(assignment_id, import_id, token)


@router.get("/assignments/{assignment_id}/cases")
def list_cases(
    assignment_id: str,
    service: ConcentraService = Depends(get_service),
    token: str | None = Depends(get_bearer_token),
) -> list[dict]:
    return service.list_cases(assignment_id, token)
