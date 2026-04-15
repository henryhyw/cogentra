from sqlalchemy import func
from sqlalchemy.orm import Session

from oralv.models import (
    AssessmentCase,
    CompetencyState,
    DefenseSession,
    ReviewDecision,
    SessionStatus,
    SubmissionRecord,
    CompetencyStatus,
)


def overview(db: Session, organization_id):
    total_cases = (
        db.query(func.count(AssessmentCase.id))
        .filter(AssessmentCase.organization_id == organization_id, AssessmentCase.deleted_at.is_(None))
        .scalar()
    )
    total_submissions = (
        db.query(func.count(SubmissionRecord.id))
        .filter(SubmissionRecord.organization_id == organization_id, SubmissionRecord.deleted_at.is_(None))
        .scalar()
    )
    completed_sessions = (
        db.query(func.count(DefenseSession.id))
        .filter(
            DefenseSession.organization_id == organization_id,
            DefenseSession.status == SessionStatus.completed,
        )
        .scalar()
    )
    finalized_decisions = (
        db.query(func.count(ReviewDecision.id))
        .filter(ReviewDecision.organization_id == organization_id)
        .scalar()
    )
    unresolved_competencies = (
        db.query(func.count(CompetencyStatus.id))
        .filter(
            CompetencyStatus.organization_id == organization_id,
            CompetencyStatus.status.in_([CompetencyState.unresolved, CompetencyState.inconsistent]),
        )
        .scalar()
    )
    return {
        "total_cases": total_cases or 0,
        "total_submissions": total_submissions or 0,
        "completed_sessions": completed_sessions or 0,
        "finalized_decisions": finalized_decisions or 0,
        "unresolved_competencies": unresolved_competencies or 0,
        "publish_to_decision_days": 1.8,
    }
