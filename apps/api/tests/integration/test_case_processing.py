from oralv.models import Artifact, ArtifactKind, ArtifactStatus, AssignmentFamily, Organization, SubmissionRecord, User
from oralv.security import hash_password
from oralv.services.cases import create_case
from oralv.services.pipeline import process_case_ingestion


class FakeStorage:
    def download_bytes(self, object_name: str) -> bytes:
        mapping = {
            "assignment": b"Students must justify method choices and explain evidence.",
            "rubric": b"Evidence use\nTradeoff analysis\nExplanation quality",
            "submission": b"I designed the approach because the assignment required practical evidence and tradeoff reasoning."
        }
        return mapping[object_name]


def test_process_case_creates_submission_and_plan(db_session, monkeypatch):
    monkeypatch.setattr("oralv.services.pipeline.StorageClient", lambda: FakeStorage())
    org = Organization(name="Test Org", slug="test-org")
    user = User(email="tester@example.com", full_name="Tester", hashed_password=hash_password("ChangeMe123!"))
    db_session.add_all([org, user])
    db_session.flush()
    case = create_case(
        db_session,
        organization_id=org.id,
        created_by_user_id=user.id,
        title="Integrated Case",
        description="Case for integration",
        course_name="Studio",
        assignment_family=AssignmentFamily.report,
        template_id=None,
    )
    db_session.add_all(
        [
            Artifact(
                organization_id=org.id,
                case_id=case.id,
                kind=ArtifactKind.assignment,
                status=ArtifactStatus.uploaded,
                filename="assignment.txt",
                content_type="text/plain",
                storage_key="assignment",
                byte_size=100,
                metadata_json={},
            ),
            Artifact(
                organization_id=org.id,
                case_id=case.id,
                kind=ArtifactKind.rubric,
                status=ArtifactStatus.uploaded,
                filename="rubric.txt",
                content_type="text/plain",
                storage_key="rubric",
                byte_size=100,
                metadata_json={},
            ),
            Artifact(
                organization_id=org.id,
                case_id=case.id,
                kind=ArtifactKind.submission,
                status=ArtifactStatus.uploaded,
                filename="student.txt",
                content_type="text/plain",
                storage_key="submission",
                byte_size=100,
                metadata_json={},
            ),
        ]
    )
    db_session.commit()

    result = process_case_ingestion(db_session, str(case.id))

    assert result["status"] == "processed"
    assert db_session.query(SubmissionRecord).count() == 1
