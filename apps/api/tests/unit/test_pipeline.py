from oralv.models import ArtifactKind
from oralv.services.pipeline import classify_artifact, infer_student_identity, normalize_artifact


def test_classify_artifact_prefers_rubric_keywords():
    kind, confidence = classify_artifact("grading-rubric.pdf", "application/pdf")
    assert kind == ArtifactKind.rubric
    assert confidence > 0.9


def test_infer_student_identity_from_filename():
    name, email = infer_student_identity("maya_lam_policy_essay.txt")
    assert name == "Maya Lam Policy Essay"
    assert email == "maya.lam.policy.essay@demo.student"


def test_normalize_artifact_extracts_claims_for_submission():
    result = normalize_artifact(
        ArtifactKind.submission,
        "report",
        "I designed the rollout because budget and access constraints both mattered. "
        "I evaluated the tradeoffs and proposed a phased deployment.",
    )
    assert result.normalized["family"] == "report"
    assert result.normalized["claims"]
