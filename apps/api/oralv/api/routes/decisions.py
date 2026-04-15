from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from oralv.api.deps import AuthContext, require_auth, require_csrf
from oralv.db import get_db
from oralv.schemas.sessions import DecisionRequest
from oralv.services.review import finalize_decision, reviewer_workspace

router = APIRouter()


@router.get("/submissions/{submission_id}")
def submission_workspace(
    submission_id: str,
    context: AuthContext = Depends(require_auth),
    db: Session = Depends(get_db),
):
    payload = reviewer_workspace(db, submission_id)
    return {
        "case": {
            "id": str(payload["case"].id),
            "title": payload["case"].title,
        },
        "submission": {
            "id": str(payload["submission"].id),
            "student_name": payload["submission"].student_name,
            "student_email": payload["submission"].student_email,
            "status": payload["submission"].status,
        },
        "plan": {
            "id": str(payload["plan"].id),
            "status": payload["plan"].status.value,
        }
        if payload["plan"]
        else None,
        "session": {
            "id": str(payload["session"].id),
            "status": payload["session"].status.value,
            "public_token": payload["session"].public_token,
        }
        if payload["session"]
        else None,
        "competencies": [
            {
                "id": str(item.id),
                "label": item.label,
                "status": item.status.value,
                "score": float(item.score),
                "summary": item.summary,
            }
            for item in payload["competencies"]
        ],
        "evidence": [
            {
                "id": str(item.id),
                "title": item.title,
                "status": item.status.value,
                "evidence_snippet": item.evidence_snippet,
                "confidence": item.confidence,
                "rationale": item.rationale,
            }
            for item in payload["evidence"]
        ],
        "responses": [
            {
                "id": str(item.id),
                "sequence": item.sequence,
                "transcript_text": item.transcript_text,
            }
            for item in payload["responses"]
        ],
        "transcript_segments": [
            {
                "id": str(item.id),
                "start_ms": item.start_ms,
                "text": item.text,
                "confidence": item.confidence,
            }
            for item in payload["transcript_segments"]
        ],
        "decision": {
            "verdict": payload["decision"].verdict.value,
            "summary": payload["decision"].summary,
            "reviewer_note": payload["decision"].reviewer_note,
        }
        if payload["decision"]
        else None,
        "artifacts": payload["artifacts"],
    }


@router.post("/submissions/{submission_id}", dependencies=[Depends(require_csrf)])
def decide_submission(
    submission_id: str,
    body: DecisionRequest,
    context: AuthContext = Depends(require_auth),
    db: Session = Depends(get_db),
):
    decision = finalize_decision(
        db,
        submission_id=submission_id,
        decided_by_user_id=context.user.id,
        verdict=body.verdict,
        summary=body.summary,
        reviewer_note=body.reviewer_note,
    )
    return {"decision_id": str(decision.id), "verdict": decision.verdict.value}
