from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from oralv.api.deps import AuthContext, require_auth
from oralv.db import get_db
from oralv.models import DefenseSession
from oralv.services.sessions import complete_session, get_session_public, start_session, submit_response

router = APIRouter()


def _serialize_public_payload(payload):
    return {
        "session": {
            "id": str(payload["session"].id),
            "status": payload["session"].status.value,
            "completion_percent": payload["session"].completion_percent,
        },
        "questions": [
            {
                "id": str(question.id),
                "sequence": question.sequence,
                "prompt": question.prompt,
                "prep_seconds": question.prep_seconds,
                "response_seconds": question.response_seconds,
            }
            for question in payload["questions"]
        ],
        "responses": [
            {
                "id": str(response.id),
                "defense_question_id": str(response.defense_question_id),
                "transcript_text": response.transcript_text,
            }
            for response in payload["responses"]
        ],
    }


@router.get("/{session_id}")
def get_session(session_id: str, context: AuthContext = Depends(require_auth), db: Session = Depends(get_db)):
    session = db.query(DefenseSession).filter(DefenseSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return _serialize_public_payload(get_session_public(db, session.public_token))


@router.get("/public/{token}")
def public_session(token: str, db: Session = Depends(get_db)):
    return _serialize_public_payload(get_session_public(db, token))


@router.post("/public/{token}/start")
def begin_public_session(token: str, db: Session = Depends(get_db)):
    session = start_session(db, token)
    return {"session_id": str(session.id), "status": session.status.value}


@router.post("/public/{token}/responses/{question_id}")
def upload_public_response(
    token: str,
    question_id: str,
    file: UploadFile | None = File(default=None),
    transcript_hint: str | None = Form(default=None),
    prep_duration_seconds: int | None = Form(default=None),
    response_duration_seconds: int | None = Form(default=None),
    db: Session = Depends(get_db),
):
    response = submit_response(
        db,
        token=token,
        question_id=question_id,
        file=file,
        transcript_hint=transcript_hint,
        prep_duration_seconds=prep_duration_seconds,
        response_duration_seconds=response_duration_seconds,
    )
    return {"response_id": str(response.id), "transcript_text": response.transcript_text}


@router.post("/public/{token}/complete")
def finish_public_session(token: str, db: Session = Depends(get_db)):
    payload = complete_session(db, token)
    return {
        "session": {
            "id": str(payload["session"].id),
            "status": payload["session"].status.value,
        },
        "result": payload["result"],
    }
