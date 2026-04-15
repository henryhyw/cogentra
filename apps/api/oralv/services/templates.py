from sqlalchemy.orm import Session

from oralv.models import AssessmentCase, AssessmentTemplate, DefensePlan
from oralv.services.audit import log_event


def list_templates(db: Session, organization_id):
    return (
        db.query(AssessmentTemplate)
        .filter(
            AssessmentTemplate.organization_id == organization_id,
            AssessmentTemplate.deleted_at.is_(None),
            AssessmentTemplate.is_archived.is_(False),
        )
        .order_by(AssessmentTemplate.created_at.desc())
        .all()
    )


def create_template_from_case(db: Session, *, organization_id, case_id, created_by_user_id, title: str):
    case = db.query(AssessmentCase).filter(AssessmentCase.id == case_id).first()
    latest_plan = (
        db.query(DefensePlan)
        .filter(DefensePlan.case_id == case_id)
        .order_by(DefensePlan.created_at.desc())
        .first()
    )
    template = AssessmentTemplate(
        organization_id=organization_id,
        created_by_user_id=created_by_user_id,
        title=title,
        description=case.description if case else None,
        assignment_family=case.assignment_family,
        config_json={"course_name": case.course_name if case else None},
        plan_snapshot_json=latest_plan.plan_json if latest_plan else {},
    )
    db.add(template)
    db.flush()
    log_event(
        db,
        organization_id=organization_id,
        event_type="template.created",
        entity_type="assessment_template",
        entity_id=str(template.id),
        actor_type="user",
        user_id=created_by_user_id,
        case_id=case_id,
    )
    db.commit()
    return template
