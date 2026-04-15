from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from oralv.api.deps import AuthContext, require_auth
from oralv.db import get_db
from oralv.services.review import case_audit, export_case_audit

router = APIRouter()


@router.get("/cases/{case_id}")
def list_case_audit(case_id: str, context: AuthContext = Depends(require_auth), db: Session = Depends(get_db)):
    events = case_audit(db, case_id)
    return {
        "events": [
            {
                "id": str(event.id),
                "created_at": event.created_at,
                "event_type": event.event_type,
                "entity_type": event.entity_type,
                "entity_id": event.entity_id,
                "actor_type": event.actor_type.value,
                "payload": event.payload_json,
            }
            for event in events
        ]
    }


@router.get("/cases/{case_id}/export")
def export_audit(case_id: str, context: AuthContext = Depends(require_auth), db: Session = Depends(get_db)):
    return export_case_audit(db, case_id)
