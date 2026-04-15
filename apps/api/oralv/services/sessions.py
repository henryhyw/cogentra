import uuid
from typing import Any

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from oralv.models import (
    Artifact,
    ArtifactKind,
    ArtifactStatus,
    DefensePlan,
    DefenseQuestion,
    DefenseSession,
    ResponseSegment,
    ResponseStatus,
    SessionStatus,
    TranscriptSegment,
)
from oralv.providers.registry import registry
from oralv.services.audit import log_event
from oralv.services.pipeline import _segment_sentences, publish_session_for_plan, synthesize_evidence
from oralv.storage import StorageClient


def publish_plan_session(db: Session, plan_id):
    plan = db.query(DefensePlan).filter(DefensePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return publish_session_for_plan(db, plan)


def get_session_public(db: Session, token: str) -> dict[str, Any]:
    session = db.query(DefenseSession).filter(DefenseSession.public_token == token).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    questions = (
        db.query(DefenseQuestion)
        .filter(DefenseQuestion.defense_plan_id == session.defense_plan_id, DefenseQuestion.is_active.is_(True))
        .order_by(DefenseQuestion.sequence.asc())
        .all()
    )
    responses = (
        db.query(ResponseSegment)
        .filter(ResponseSegment.defense_session_id == session.id)
        .order_by(ResponseSegment.sequence.asc())
        .all()
    )
    return {"session": session, "questions": questions, "responses": responses}


def start_session(db: Session, token: str) -> DefenseSession:
    session = db.query(DefenseSession).filter(DefenseSession.public_token == token).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    session.status = SessionStatus.active
    if not session.started_at:
        session.started_at = __import__("datetime").datetime.now(__import__("datetime").UTC)
    db.commit()
    return session


def submit_response(
    db: Session,
    *,
    token: str,
    question_id,
    file: UploadFile | None,
    transcript_hint: str | None,
    prep_duration_seconds: int | None,
    response_duration_seconds: int | None,
) -> ResponseSegment:
    session = db.query(DefenseSession).filter(DefenseSession.public_token == token).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    question = db.query(DefenseQuestion).filter(DefenseQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    storage = StorageClient()
    artifact = None
    if file:
        payload = file.file.read()
        object_name = f"sessions/{session.id}/{uuid.uuid4().hex}-{file.filename}"
        storage.upload_bytes(object_name, payload, file.content_type or "application/octet-stream")
        artifact = Artifact(
            organization_id=session.organization_id,
            case_id=session.case_id,
            submission_record_id=session.submission_record_id,
            kind=ArtifactKind.recording,
            status=ArtifactStatus.ready,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream",
            storage_key=object_name,
            byte_size=len(payload),
            metadata_json={"uploaded_for_question_id": str(question.id)},
        )
        db.add(artifact)
        db.flush()

    response = (
        db.query(ResponseSegment)
        .filter(
            ResponseSegment.defense_session_id == session.id,
            ResponseSegment.defense_question_id == question.id,
        )
        .first()
    )
    if not response:
        response = ResponseSegment(
            organization_id=session.organization_id,
            defense_session_id=session.id,
            defense_question_id=question.id,
            sequence=question.sequence,
        )
        db.add(response)
        db.flush()
    response.status = ResponseStatus.uploaded
    response.artifact_id = artifact.id if artifact else response.artifact_id
    response.prep_duration_seconds = prep_duration_seconds
    response.response_duration_seconds = response_duration_seconds
    transcript_result = registry.asr_provider().transcribe(
        file.filename if file else f"{question.sequence}.txt",
        transcript_hint=transcript_hint,
    )
    response.transcript_text = transcript_result.text
    response.confidence = transcript_result.metadata.get("confidence", 0.88)
    response.submitted_at = __import__("datetime").datetime.now(__import__("datetime").UTC)
    response.status = ResponseStatus.transcribed
    existing_segments = (
        db.query(TranscriptSegment).filter(TranscriptSegment.response_segment_id == response.id).all()
    )
    for segment in existing_segments:
        db.delete(segment)
    db.flush()
    running_ms = 0
    for index, sentence in enumerate(_segment_sentences(response.transcript_text), start=1):
        duration_ms = max(4000, len(sentence.split()) * 550)
        transcript_segment = TranscriptSegment(
            organization_id=session.organization_id,
            defense_session_id=session.id,
            response_segment_id=response.id,
            start_ms=running_ms,
            end_ms=running_ms + duration_ms,
            text=sentence,
            confidence=response.confidence or 0.88,
            embedding=registry.embedding().embed(sentence),
        )
        db.add(transcript_segment)
        running_ms += duration_ms
    answered_count = (
        db.query(ResponseSegment).filter(ResponseSegment.defense_session_id == session.id).count()
    )
    question_count = (
        db.query(DefenseQuestion).filter(DefenseQuestion.defense_plan_id == session.defense_plan_id).count()
    )
    session.completion_percent = round(answered_count / max(question_count, 1) * 100, 2)
    log_event(
        db,
        organization_id=session.organization_id,
        event_type="session.response_submitted",
        entity_type="response_segment",
        entity_id=str(response.id),
        actor_type="student",
        case_id=session.case_id,
        submission_record_id=session.submission_record_id,
        defense_session_id=session.id,
    )
    db.commit()
    return response


def complete_session(db: Session, token: str) -> dict[str, Any]:
    session = db.query(DefenseSession).filter(DefenseSession.public_token == token).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    questions = db.query(DefenseQuestion).filter(DefenseQuestion.defense_plan_id == session.defense_plan_id).count()
    responses = db.query(ResponseSegment).filter(ResponseSegment.defense_session_id == session.id).count()
    if responses < questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All questions must be answered")
    session.status = SessionStatus.submitted
    session.submitted_at = __import__("datetime").datetime.now(__import__("datetime").UTC)
    db.commit()
    result = synthesize_evidence(db, str(session.id))
    return {"session": session, "result": result}
