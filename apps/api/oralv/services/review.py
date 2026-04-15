from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from oralv.models import (
    Artifact,
    AssessmentCase,
    AuditEvent,
    CompetencyStatus,
    DefensePlan,
    DefenseQuestion,
    DefenseSession,
    EvidenceItem,
    ReviewDecision,
    SubmissionRecord,
    ResponseSegment,
    TranscriptSegment,
)
from oralv.models.entities import AuditActorType, DecisionVerdict
from oralv.services.audit import log_event
from oralv.services.pipeline import to_csv
from oralv.storage import StorageClient


def reviewer_workspace(db: Session, submission_id) -> dict[str, Any]:
    submission = db.query(SubmissionRecord).filter(SubmissionRecord.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    case = db.query(AssessmentCase).filter(AssessmentCase.id == submission.case_id).first()
    plan = (
        db.query(DefensePlan)
        .filter(DefensePlan.submission_record_id == submission.id)
        .order_by(DefensePlan.created_at.desc())
        .first()
    )
    questions = (
        db.query(DefenseQuestion)
        .filter(DefenseQuestion.defense_plan_id == plan.id)
        .order_by(DefenseQuestion.sequence.asc())
        .all()
        if plan
        else []
    )
    session = (
        db.query(DefenseSession)
        .filter(DefenseSession.submission_record_id == submission.id)
        .order_by(DefenseSession.created_at.desc())
        .first()
    )
    evidence = (
        db.query(EvidenceItem)
        .filter(EvidenceItem.submission_record_id == submission.id)
        .order_by(EvidenceItem.created_at.asc())
        .all()
    )
    responses = []
    transcript_segments = []
    if session:
        responses = (
            db.query(ResponseSegment)
            .filter(ResponseSegment.defense_session_id == session.id)
            .order_by(ResponseSegment.sequence.asc())
            .all()
        )
        transcript_segments = (
            db.query(TranscriptSegment)
            .filter(TranscriptSegment.defense_session_id == session.id)
            .order_by(TranscriptSegment.start_ms.asc())
            .all()
        )
    competencies = (
        db.query(CompetencyStatus)
        .filter(CompetencyStatus.submission_record_id == submission.id)
        .order_by(CompetencyStatus.label.asc())
        .all()
    )
    decision = db.query(ReviewDecision).filter(ReviewDecision.submission_record_id == submission.id).first()
    artifacts = (
        db.query(Artifact)
        .filter(Artifact.submission_record_id == submission.id, Artifact.deleted_at.is_(None))
        .all()
    )
    storage = StorageClient()
    return {
        "case": case,
        "submission": submission,
        "plan": plan,
        "questions": questions,
        "session": session,
        "evidence": evidence,
        "competencies": competencies,
        "decision": decision,
        "responses": responses,
        "transcript_segments": transcript_segments,
        "artifacts": [
            {
                "id": str(artifact.id),
                "kind": artifact.kind.value,
                "filename": artifact.filename,
                "signed_url": storage.signed_get_url(artifact.storage_key),
            }
            for artifact in artifacts
        ],
    }


def finalize_decision(
    db: Session,
    *,
    submission_id,
    decided_by_user_id,
    verdict: DecisionVerdict,
    summary: str,
    reviewer_note: str | None,
) -> ReviewDecision:
    submission = db.query(SubmissionRecord).filter(SubmissionRecord.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    decision = db.query(ReviewDecision).filter(ReviewDecision.submission_record_id == submission_id).first()
    if not decision:
        decision = ReviewDecision(
            organization_id=submission.organization_id,
            case_id=submission.case_id,
            submission_record_id=submission.id,
            decided_by_user_id=decided_by_user_id,
            verdict=verdict,
            summary=summary,
            reviewer_note=reviewer_note,
            confidence_band="medium",
        )
        db.add(decision)
    else:
        decision.decided_by_user_id = decided_by_user_id
        decision.verdict = verdict
        decision.summary = summary
        decision.reviewer_note = reviewer_note
    submission.status = "decision_finalized"
    log_event(
        db,
        organization_id=submission.organization_id,
        event_type="decision.finalized",
        entity_type="review_decision",
        entity_id=str(decision.id),
        actor_type=AuditActorType.user,
        user_id=decided_by_user_id,
        case_id=submission.case_id,
        submission_record_id=submission.id,
        payload={"verdict": verdict.value},
    )
    db.commit()
    return decision


def case_audit(db: Session, case_id) -> list[AuditEvent]:
    return (
        db.query(AuditEvent)
        .filter(AuditEvent.case_id == case_id)
        .order_by(AuditEvent.created_at.desc())
        .all()
    )


def export_case_audit(db: Session, case_id) -> dict[str, Any]:
    events = case_audit(db, case_id)
    decisions = db.query(ReviewDecision).filter(ReviewDecision.case_id == case_id).all()
    competencies = db.query(CompetencyStatus).filter(CompetencyStatus.case_id == case_id).all()
    event_rows = [
        {
            "created_at": event.created_at.isoformat(),
            "event_type": event.event_type,
            "entity_type": event.entity_type,
            "entity_id": event.entity_id,
            "actor_type": event.actor_type.value,
        }
        for event in events
    ]
    decision_rows = [
        {
            "submission_id": str(decision.submission_record_id),
            "verdict": decision.verdict.value,
            "summary": decision.summary,
            "decided_at": decision.decided_at.isoformat(),
        }
        for decision in decisions
    ]
    competency_rows = [
        {
            "submission_id": str(item.submission_record_id),
            "competency_key": item.competency_key,
            "status": item.status.value,
            "score": float(item.score),
        }
        for item in competencies
    ]
    return {
        "events": event_rows,
        "decisions": decision_rows,
        "competencies": competency_rows,
        "csv": {
            "events": to_csv(event_rows),
            "decisions": to_csv(decision_rows),
            "competencies": to_csv(competency_rows),
        },
    }
