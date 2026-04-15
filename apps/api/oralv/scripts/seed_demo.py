from oralv.db import Base, SessionLocal, engine
from oralv.models import (
    Artifact,
    ArtifactKind,
    ArtifactStatus,
    AssignmentFamily,
    DefensePlan,
    DefenseQuestion,
    DecisionVerdict,
    Organization,
    OrganizationMembership,
    RoleType,
    SubmissionRecord,
    User,
)
from oralv.security import hash_password
from oralv.services.auth import invite_member
from oralv.services.cases import create_case
from oralv.services.pipeline import process_case_ingestion
from oralv.services.review import finalize_decision
from oralv.services.sessions import complete_session, publish_plan_session, submit_response
from oralv.services.templates import create_template_from_case
from oralv.storage import StorageClient


DEMO_PASSWORD = "ChangeMe123!"


def _upsert_user(db, email: str, full_name: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.full_name = full_name
        user.hashed_password = hash_password(DEMO_PASSWORD)
        return user
    user = User(email=email, full_name=full_name, hashed_password=hash_password(DEMO_PASSWORD))
    db.add(user)
    db.flush()
    return user


def _artifact(db, storage: StorageClient, *, organization_id, case_id, kind: ArtifactKind, filename: str, text: str):
    object_name = f"seed/{case_id}/{filename}"
    storage.upload_bytes(object_name, text.encode("utf-8"), "text/plain")
    artifact = Artifact(
        organization_id=organization_id,
        case_id=case_id,
        kind=kind,
        status=ArtifactStatus.uploaded,
        filename=filename,
        content_type="text/plain",
        storage_key=object_name,
        byte_size=len(text.encode("utf-8")),
        classification_confidence=1.0,
        metadata_json={"seeded": True},
    )
    db.add(artifact)
    db.flush()
    return artifact


def main() -> None:
    Base.metadata.create_all(bind=engine)
    storage = StorageClient()
    with SessionLocal() as db:
        org = db.query(Organization).filter(Organization.slug == "northstar-ac").first()
        if not org:
            org = Organization(name="Northstar Academy", slug="northstar-ac", industry="Education")
            db.add(org)
            db.flush()
        existing_case = db.query(DefensePlan).first()
        if existing_case:
            print("Seed already present.")
            return

        owner = _upsert_user(db, "owner@northstar.ac", "Avery Hart")
        reviewer = _upsert_user(db, "reviewer@northstar.ac", "Mina Sol")
        admin = _upsert_user(db, "admin@northstar.ac", "Joel Grant")
        for user, role, title in [
            (owner, RoleType.owner, "Program lead"),
            (reviewer, RoleType.reviewer, "Assessment reviewer"),
            (admin, RoleType.admin, "Operations admin"),
        ]:
            membership = (
                db.query(OrganizationMembership)
                .filter(OrganizationMembership.organization_id == org.id, OrganizationMembership.user_id == user.id)
                .first()
            )
            if not membership:
                db.add(
                    OrganizationMembership(
                        organization_id=org.id,
                        user_id=user.id,
                        role=role,
                        title=title,
                    )
                )
        db.commit()

        report_case = create_case(
            db,
            organization_id=org.id,
            created_by_user_id=owner.id,
            title="Urban Mobility Policy Essay",
            description="Verify whether policy recommendations reflect the submitted analysis.",
            course_name="Contemporary Policy Studio",
            assignment_family=AssignmentFamily.report,
            template_id=None,
        )
        _artifact(
            db,
            storage,
            organization_id=org.id,
            case_id=report_case.id,
            kind=ArtifactKind.assignment,
            filename="assignment-brief.txt",
            text=(
                "Students must propose a three-part urban mobility intervention for a midsize city. "
                "They should justify tradeoffs, cite evidence, and explain implementation sequencing."
            ),
        )
        _artifact(
            db,
            storage,
            organization_id=org.id,
            case_id=report_case.id,
            kind=ArtifactKind.rubric,
            filename="rubric.txt",
            text=(
                "Evidence use\nTradeoff analysis\nImplementation feasibility\nAlignment to stakeholder needs\n"
                "Clarity of causal reasoning"
            ),
        )
        _artifact(
            db,
            storage,
            organization_id=org.id,
            case_id=report_case.id,
            kind=ArtifactKind.submission,
            filename="maya_lam_policy_essay.txt",
            text=(
                "I proposed dedicated bus lanes, curb pricing, and protected cycling links because the city "
                "needs mode shift without widening roads. I designed the rollout in two phases and evaluated "
                "tradeoffs for merchants, commuters, and emissions targets."
            ),
        )
        process_case_ingestion(db, str(report_case.id))
        report_plan = db.query(DefensePlan).filter_by(case_id=report_case.id).first()
        if not report_plan:
            raise RuntimeError("Expected report plan to be generated")
        report_session = publish_plan_session(db, report_plan.id)
        public = report_session.public_token
        questions = (
            db.query(DefenseQuestion)
            .filter_by(defense_plan_id=report_plan.id)
            .order_by(DefenseQuestion.sequence.asc())
            .all()
        )
        for index, question in enumerate(questions, start=1):
            submit_response(
                db,
                token=public,
                question_id=question.id,
                file=None,
                transcript_hint=(
                    f"For question {index}, the student explains the policy decision because it balances speed, "
                    "equity, and budget constraints, and gives a concrete example from the submitted essay."
                ),
                prep_duration_seconds=30,
                response_duration_seconds=120,
        )
        complete_session(db, public)
        submission = db.query(SubmissionRecord).filter_by(case_id=report_case.id).first()
        if not submission:
            raise RuntimeError("Expected report submission to exist")
        finalize_decision(
            db,
            submission_id=submission.id,
            decided_by_user_id=reviewer.id,
            verdict=DecisionVerdict.verified,
            summary="Student demonstrated ownership of the policy logic and defended the implementation tradeoffs clearly.",
            reviewer_note="Strong evidence of authorship and reasoning under questioning.",
        )

        presentation_case = create_case(
            db,
            organization_id=org.id,
            created_by_user_id=owner.id,
            title="Healthcare Access Deck",
            description="Async oral verification for a slide-backed proposal.",
            course_name="Public Systems Lab",
            assignment_family=AssignmentFamily.presentation,
            template_id=None,
        )
        _artifact(
            db,
            storage,
            organization_id=org.id,
            case_id=presentation_case.id,
            kind=ArtifactKind.assignment,
            filename="presentation-brief.txt",
            text="Students prepare a slide deck arguing for one intervention that expands healthcare access in rural districts.",
        )
        _artifact(
            db,
            storage,
            organization_id=org.id,
            case_id=presentation_case.id,
            kind=ArtifactKind.rubric,
            filename="criteria.txt",
            text="Narrative logic\nUse of evidence\nAudience fit\nRisk identification",
        )
        _artifact(
            db,
            storage,
            organization_id=org.id,
            case_id=presentation_case.id,
            kind=ArtifactKind.submission,
            filename="carlos_nguyen_deck.txt",
            text="The deck proposes mobile clinic days and a regional scheduling hotline because transport distance is the main barrier. It uses county data and compares three rollout options.",
        )
        process_case_ingestion(db, str(presentation_case.id))
        presentation_plan = db.query(DefensePlan).filter_by(case_id=presentation_case.id).first()
        if not presentation_plan:
            raise RuntimeError("Expected presentation plan to be generated")
        presentation_session = publish_plan_session(db, presentation_plan.id)
        q = (
            db.query(DefenseQuestion)
            .filter_by(defense_plan_id=presentation_plan.id)
            .order_by(DefenseQuestion.sequence.asc())
            .first()
        )
        if not q:
            raise RuntimeError("Expected presentation question to be generated")
        submit_response(
            db,
            token=presentation_session.public_token,
            question_id=q.id,
            file=None,
            transcript_hint="The student answers generally, references the slide title, but gives limited evidence or implementation detail.",
            prep_duration_seconds=25,
            response_duration_seconds=55,
        )

        technical_case = create_case(
            db,
            organization_id=org.id,
            created_by_user_id=owner.id,
            title="Notebook-Based Forecasting Project",
            description="Batch intake for multiple technical submissions.",
            course_name="Applied Analytics",
            assignment_family=AssignmentFamily.technical,
            template_id=None,
        )
        _artifact(
            db,
            storage,
            organization_id=org.id,
            case_id=technical_case.id,
            kind=ArtifactKind.assignment,
            filename="assignment.txt",
            text="Build a demand forecast using one notebook, justify feature choices, and explain model validation decisions.",
        )
        _artifact(
            db,
            storage,
            organization_id=org.id,
            case_id=technical_case.id,
            kind=ArtifactKind.rubric,
            filename="rubric.txt",
            text="Feature reasoning\nValidation logic\nError analysis\nBusiness translation",
        )
        _artifact(
            db,
            storage,
            organization_id=org.id,
            case_id=technical_case.id,
            kind=ArtifactKind.submission,
            filename="sam_cho_forecast_bundle.txt",
            text="I implemented a gradient boosting model, evaluated weekly error patterns, and used lag features because seasonality and promotions were both material drivers.",
        )
        _artifact(
            db,
            storage,
            organization_id=org.id,
            case_id=technical_case.id,
            kind=ArtifactKind.submission,
            filename="riley_kim_forecast_bundle.txt",
            text="The notebook uses a benchmark linear model and a tree-based alternative. I compared validation windows and proposed why promotional events skew residuals.",
        )
        process_case_ingestion(db, str(technical_case.id))
        create_template_from_case(
            db,
            organization_id=org.id,
            case_id=technical_case.id,
            created_by_user_id=owner.id,
            title="Forecasting Verification Template",
        )
        invite_member(
            db,
            organization_id=org.id,
            invited_by_user_id=owner.id,
            email="faculty-observer@northstar.ac",
            role=RoleType.reviewer,
        )
        db.commit()
        print("Seed complete.")


if __name__ == "__main__":
    main()
