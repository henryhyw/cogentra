from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from oralv.models import AuditActorType, AuditEvent


def log_event(
    db: Session,
    *,
    organization_id: UUID,
    event_type: str,
    entity_type: str,
    entity_id: str,
    actor_type: AuditActorType | str,
    user_id: UUID | None = None,
    case_id: UUID | None = None,
    submission_record_id: UUID | None = None,
    defense_session_id: UUID | None = None,
    payload: dict[str, Any] | None = None,
) -> AuditEvent:
    event = AuditEvent(
        organization_id=organization_id,
        case_id=case_id,
        submission_record_id=submission_record_id,
        defense_session_id=defense_session_id,
        user_id=user_id,
        actor_type=actor_type if isinstance(actor_type, AuditActorType) else AuditActorType(actor_type),
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        payload_json=payload or {},
    )
    db.add(event)
    db.flush()
    return event
