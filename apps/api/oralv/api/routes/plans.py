from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from oralv.api.deps import AuthContext, require_auth, require_csrf
from oralv.db import get_db
from oralv.models import DefensePlan, DefenseQuestion, DefenseSession, SubmissionRecord
from oralv.schemas.cases import UpdatePlanRequest
from oralv.services.sessions import publish_plan_session

router = APIRouter()


@router.get("/submission/{submission_id}")
def get_submission_plan(
    submission_id: str,
    context: AuthContext = Depends(require_auth),
    db: Session = Depends(get_db),
):
    plan = (
        db.query(DefensePlan)
        .filter(DefensePlan.submission_record_id == submission_id)
        .order_by(DefensePlan.created_at.desc())
        .first()
    )
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    questions = (
        db.query(DefenseQuestion)
        .filter(DefenseQuestion.defense_plan_id == plan.id)
        .order_by(DefenseQuestion.sequence.asc())
        .all()
    )
    submission = db.query(SubmissionRecord).filter(SubmissionRecord.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    session = (
        db.query(DefenseSession)
        .filter(DefenseSession.submission_record_id == submission_id)
        .order_by(DefenseSession.created_at.desc())
        .first()
    )
    return {
        "submission": {
            "id": str(submission.id),
            "student_name": submission.student_name,
            "student_email": submission.student_email,
            "status": submission.status,
        },
        "plan": {
            "id": str(plan.id),
            "status": plan.status.value,
            "version_number": plan.version_number,
            "focus_graph_json": plan.focus_graph_json,
            "plan_json": plan.plan_json,
            "settings_json": plan.settings_json,
            "reviewer_notes": plan.reviewer_notes,
        },
        "questions": [
            {
                "id": str(question.id),
                "sequence": question.sequence,
                "prompt": question.prompt,
                "rationale": question.rationale,
                "evaluation_target": question.evaluation_target,
                "expected_signal": question.expected_signal,
                "prep_seconds": question.prep_seconds,
                "response_seconds": question.response_seconds,
                "question_kind": question.question_kind.value,
                "branch_condition_json": question.branch_condition_json,
            }
            for question in questions
        ],
        "session": {
            "id": str(session.id),
            "status": session.status.value,
            "public_token": session.public_token,
        }
        if session
        else None,
    }


@router.put("/{plan_id}", dependencies=[Depends(require_csrf)])
def update_plan(
    plan_id: str,
    body: UpdatePlanRequest,
    context: AuthContext = Depends(require_auth),
    db: Session = Depends(get_db),
):
    plan = db.query(DefensePlan).filter(DefensePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    plan.focus_graph_json = body.focus_graph_json
    plan.plan_json = body.plan_json
    plan.settings_json = body.settings_json
    plan.reviewer_notes = body.reviewer_notes
    existing = db.query(DefenseQuestion).filter(DefenseQuestion.defense_plan_id == plan.id).all()
    for question in existing:
        db.delete(question)
    db.flush()
    for item in body.questions:
        question = DefenseQuestion(
            defense_plan_id=plan.id,
            sequence=item["sequence"],
            prompt=item["prompt"],
            rationale=item["rationale"],
            evaluation_target=item["evaluation_target"],
            expected_signal=item.get("expected_signal"),
            prep_seconds=item.get("prep_seconds", 45),
            response_seconds=item.get("response_seconds", 150),
            branch_condition_json=item.get("branch_condition_json", {}),
        )
        db.add(question)
    db.commit()
    return {"plan_id": plan_id}


@router.post("/{plan_id}/publish", dependencies=[Depends(require_csrf)])
def publish_plan(plan_id: str, context: AuthContext = Depends(require_auth), db: Session = Depends(get_db)):
    session = publish_plan_session(db, plan_id)
    return {"session_id": str(session.id), "public_token": session.public_token}
