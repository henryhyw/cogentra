from __future__ import annotations

from urllib.parse import urlparse

import pytest
from fastapi.testclient import TestClient

from app.deps import get_service
from app.main import app
from app.providers.ai.demo import DemoAIProvider
from app.services.concentra import ConcentraService
from app.services.parsing import extract_sections
from app.config import get_settings


@pytest.fixture()
def client():
    service = ConcentraService(get_settings())
    service.repository.reset()
    app.dependency_overrides[get_service] = lambda: service
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/api/demo-login", json={"email": "demo@concentra.app"})
    assert response.status_code == 200
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def put_upload(client: TestClient, upload_url: str, content: bytes) -> None:
    parsed = urlparse(upload_url)
    response = client.put(f"{parsed.path}?{parsed.query}", content=content)
    assert response.status_code == 200


def test_extract_sections_and_artifact_classification():
    sections = extract_sections("# Heading\n\nBody\n\n## Detail\n\nMore detail")
    assert sections[0].title == "Heading"
    assert sections[1].title == "Detail"

    provider = DemoAIProvider()
    result = provider.classify_artifact(
        file_name="assessment_rubric.pdf",
        mime_type="application/pdf",
        text_preview="Criteria and scoring guidance",
        is_student=False,
    )
    assert result.role == "rubric"
    assert result.confidence > 0.8


def test_seeded_demo_workspace_has_three_assignments(client: TestClient):
    response = client.get("/api/assignments", headers=auth_headers(client))
    assert response.status_code == 200
    assignments = response.json()
    assert len(assignments) == 3
    assert any(item["caseCount"] >= 5 for item in assignments)


def test_end_to_end_assignment_import_session_review_flow(client: TestClient):
    headers = auth_headers(client)

    create_assignment = client.post(
        "/api/assignments",
        headers=headers,
        json={
            "title": "Applied Policy Memo",
            "family": "report_essay",
            "description": "A short memo assignment for E2E coverage.",
        },
    )
    assert create_assignment.status_code == 200
    assignment = create_assignment.json()
    assignment_id = assignment["id"]

    artifact_upload = client.post(
        f"/api/assignments/{assignment_id}/artifacts/upload-url",
        headers=headers,
        json={"fileName": "brief.md", "mimeType": "text/markdown", "contentLength": 128},
    )
    assert artifact_upload.status_code == 200
    artifact_target = artifact_upload.json()
    put_upload(
        client,
        artifact_target["uploadUrl"],
        b"# Assignment Brief\n\nWrite a policy memo with one recommendation and one limitation section.",
    )
    register_artifact = client.post(
        f"/api/assignments/{assignment_id}/artifacts/register",
        headers=headers,
        json={
            "fileName": "brief.md",
            "storagePath": artifact_target["storagePath"],
            "mimeType": "text/markdown",
            "originalSize": 128,
        },
    )
    assert register_artifact.status_code == 200
    analyze_artifacts = client.post(
        f"/api/assignments/{assignment_id}/artifacts/analyze",
        headers=headers,
        json={},
    )
    assert analyze_artifacts.status_code == 200
    assert analyze_artifacts.json()["artifactCount"] == 1

    import_targets = []
    for file_name, content in [
        (
            "S9901_policy_memo.md",
            b"# Memo\n\n## Claim\n\nRoute riders to a new subsidy policy.\n\n## Limitation\n\nAdministrative overhead could slow rollout.",
        ),
        (
            "S9901_support_note.md",
            b"# Support Note\n\nThe student compares two options and keeps the stronger evidence trail visible.",
        ),
    ]:
        upload_response = client.post(
            f"/api/assignments/{assignment_id}/imports/upload-url",
            headers=headers,
            json={"fileName": file_name, "mimeType": "text/markdown", "contentLength": len(content)},
        )
        assert upload_response.status_code == 200
        upload_target = upload_response.json()
        put_upload(client, upload_target["uploadUrl"], content)
        import_targets.append(
            {
                "fileName": file_name,
                "storagePath": upload_target["storagePath"],
                "mimeType": "text/markdown",
                "originalSize": len(content),
            }
        )

    register_import = client.post(
        f"/api/assignments/{assignment_id}/imports/register-batch",
        headers=headers,
        json={"items": import_targets, "sourceType": "mixed", "rosterCsvPath": None},
    )
    assert register_import.status_code == 200
    import_id = register_import.json()["id"]

    analyze_import = client.post(
        f"/api/assignments/{assignment_id}/imports/{import_id}/analyze",
        headers=headers,
    )
    assert analyze_import.status_code == 200
    assert analyze_import.json()["status"] in {"ready", "blocked"}

    create_cases = client.post(
        f"/api/assignments/{assignment_id}/imports/{import_id}/create-cases",
        headers=headers,
    )
    assert create_cases.status_code == 200
    cases = create_cases.json()["cases"]
    assert len(cases) == 1
    case_id = cases[0]["id"]
    session_token = cases[0]["sessionLinkToken"]

    session_response = client.get(f"/api/session/{session_token}")
    assert session_response.status_code == 200
    session_payload = session_response.json()
    assert len(session_payload["questions"]) >= 3

    start_response = client.post(f"/api/session/{session_token}/start")
    assert start_response.status_code == 200
    questions = session_payload["questions"]
    for question in questions:
        answer_upload = client.post(
            f"/api/session/{session_token}/upload-response-url",
            json={"fileName": f"{question['id']}.webm", "mimeType": "audio/webm", "contentLength": 32},
        )
        assert answer_upload.status_code == 200
        answer_target = answer_upload.json()
        put_upload(client, answer_target["uploadUrl"], b"fake-webm-audio")
        submit_response = client.post(
            f"/api/session/{session_token}/submit-response",
            json={
                "questionId": question["id"],
                "audioPath": answer_target["storagePath"],
                "videoPath": None,
                "durationSeconds": 45,
            },
        )
        assert submit_response.status_code == 200

    complete_response = client.post(f"/api/session/{session_token}/complete")
    assert complete_response.status_code == 200
    assert complete_response.json()["reviewPriority"] in {"low", "medium", "high"}

    result_response = client.get(f"/api/cases/{case_id}/result", headers=headers)
    assert result_response.status_code == 200
    result_payload = result_response.json()
    assert result_payload["result"]["executiveSummary"]
    assert result_payload["case"]["reviewStatus"] == "needs_review"

    note_response = client.patch(
        f"/api/cases/{case_id}/review-note",
        headers=headers,
        json={"finalReviewerNote": "Evidence is coherent enough for a pass."},
    )
    assert note_response.status_code == 200

    reviewed_response = client.post(f"/api/cases/{case_id}/mark-reviewed", headers=headers)
    assert reviewed_response.status_code == 200
    assert reviewed_response.json()["reviewedAt"]
