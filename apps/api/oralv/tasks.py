from oralv.db import SessionLocal
from oralv.services.pipeline import process_case_ingestion, synthesize_evidence
from oralv.worker_app import celery_app


@celery_app.task(name="oralv.ping")
def ping() -> str:
    return "pong"


@celery_app.task(name="oralv.process_case_ingestion")
def process_case_ingestion_task(case_id: str) -> dict:
    with SessionLocal() as db:
        return process_case_ingestion(db, case_id)


@celery_app.task(name="oralv.synthesize_evidence")
def synthesize_evidence_task(defense_session_id: str) -> dict:
    with SessionLocal() as db:
        return synthesize_evidence(db, defense_session_id)
