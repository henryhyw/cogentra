from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from itsdangerous import BadSignature, URLSafeSerializer

from app.config import Settings
from app.models.api import AuthResponse, CreateAssignmentRequest, RegisterArtifactRequest, RegisterImportBatchRequest, ReviewNoteRequest, UpdateAssignmentRequest, UpdateSettingsRequest, UploadUrlRequest
from app.models.domain import (
    Artifact,
    ArtifactRole,
    Assignment,
    AssignmentStatus,
    BundleArtifact,
    Case,
    CaseResponse,
    CaseSession,
    DashboardActivity,
    DashboardData,
    GeneratedQuestion,
    ImportBundle,
    ImportItem,
    ImportJob,
    ImportStatus,
    PreviewMetadata,
    ResponseSummary,
    ReviewStatus,
    SessionStatus,
    SettingsPayload,
    now_iso,
)
from app.providers.ai.vertex import VertexAIProvider
from app.providers.speech.google import GoogleSpeechProvider
from app.providers.storage.gcs import GCSStorageProvider
from app.providers.ai.demo import DemoAIProvider
from app.providers.speech.demo import DemoSpeechProvider
from app.providers.storage.demo import DemoStorageProvider
from app.services.demo_repository import DemoRepository
from app.services.firestore_repository import FirestoreRepository
from app.services.materialization import StorageMaterializer
from app.services.parsing import extract_sections
from app.services.session_rules import build_session_completion_state
from app.services.text import detect_mime_from_name, extract_student_identifier, slugify


class ConcentraService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._firebase_auth = None
        if settings.resolved_mode == "google":
            self.repository = FirestoreRepository(settings)
            self.ai = VertexAIProvider(settings)
            self.speech = GoogleSpeechProvider(settings)
            self.storage = GCSStorageProvider(settings)
            self._firebase_auth = self._init_firebase_auth()
        else:
            self.repository = DemoRepository(settings)
            self.ai = DemoAIProvider()
            self.speech = DemoSpeechProvider()
            self.storage = DemoStorageProvider(settings)
        self.token_signer = URLSafeSerializer(settings.demo_signing_secret, salt="concentra-demo-auth")
        self.default_user_id = "user_demo_reviewer"

    def demo_login(self, email: str | None = None) -> AuthResponse:
        data = self.repository.load()
        user = self._get_default_user(data)
        if email:
            user["email"] = email
            self.repository.save(data)
        token = self.token_signer.dumps({"userId": user["id"], "mode": "demo"})
        return AuthResponse(
            token=token,
            user_id=user["id"],
            email=user["email"],
            display_name=user["displayName"],
            role=user["role"],
            mode="demo",
        )

    def resolve_user(self, token: str | None = None) -> dict:
        data = self.repository.load()
        if self.settings.resolved_mode == "google" and token and self._firebase_auth:
            try:
                decoded = self._firebase_auth.verify_id_token(token)
            except Exception:
                return self._get_default_user(data)
            user = DemoRepository.find_user(data, decoded["uid"])
            if not user:
                user = {
                    "id": decoded["uid"],
                    "email": decoded.get("email", ""),
                    "displayName": decoded.get("name", "Reviewer"),
                    "role": "reviewer",
                    "createdAt": now_iso(),
                    "updatedAt": now_iso(),
                    "preferences": {
                        "theme": "dark",
                        "defaultSessionPreferences": {
                            "questionCount": 6,
                            "answerDurationSeconds": 120,
                            "allowRerecord": True,
                            "responseMode": "audio_only",
                        },
                        "demoModeHelpers": False,
                    },
                }
                data.setdefault("users", []).append(user)
                self.repository.save(data)
            return user
        if not token:
            return self._get_default_user(data)
        try:
            payload = self.token_signer.loads(token)
        except BadSignature:
            return self._get_default_user(data)
        user = DemoRepository.find_user(data, payload["userId"])
        return user or self._get_default_user(data)

    def get_me(self, token: str | None = None) -> dict:
        user = self.resolve_user(token)
        return {
            "user": user,
            "mode": self.settings.resolved_mode,
        }

    def get_dashboard(self, token: str | None = None) -> DashboardData:
        _ = self.resolve_user(token)
        data = self.repository.load()
        assignments = sorted(data["assignments"], key=lambda item: item["updatedAt"], reverse=True)
        all_cases = [case for assignment in assignments for case in assignment.get("cases", [])]
        pending_cases = [case for case in all_cases if case["reviewStatus"] == "needs_review"][:5]
        return DashboardData(
            active_assignments=sum(1 for assignment in assignments if assignment["status"] != "archived"),
            pending_reviews=sum(1 for case in all_cases if case["reviewStatus"] == "needs_review"),
            sessions_completed=sum(
                1 for case in all_cases if case.get("sessionStatus") in {"completed", "transcript_ready", "summary_ready"}
            ),
            cases_with_flags=sum(1 for case in all_cases if any(flag["tone"] != "neutral" for flag in case.get("previewFlags", []))),
            recent_assignments=[Assignment.model_validate(item) for item in assignments[:4]],
            pending_cases=[Case.model_validate(item) for item in pending_cases],
            recent_activity=[DashboardActivity.model_validate(item) for item in data.get("activityFeed", [])[:8]],
        )

    def list_assignments(self, token: str | None = None) -> list[Assignment]:
        _ = self.resolve_user(token)
        data = self.repository.load()
        return [Assignment.model_validate(item) for item in sorted(data["assignments"], key=lambda assignment: assignment["updatedAt"], reverse=True)]

    def create_assignment(self, payload: CreateAssignmentRequest, token: str | None = None) -> dict:
        user = self.resolve_user(token)
        data = self.repository.load()
        assignment_id = f"assignment_{slugify(payload.title)}_{uuid4().hex[:6]}"
        now = now_iso()
        assignment = Assignment.model_construct(
            id=assignment_id,
            title=payload.title,
            family=payload.family,
            description=payload.description,
            status=AssignmentStatus.DRAFT,
            created_by=user["id"],
            created_at=now,
            updated_at=now,
            session_defaults=user["preferences"]["defaultSessionPreferences"],
            verification_goals=[],
            ai_summary="",
            ai_summary_confidence=0.0,
            assignment_understanding=None,
            artifact_count=0,
            case_count=0,
            completed_session_count=0,
            pending_review_count=0,
        )
        understanding = self.ai.understand_assignment(assignment, [])
        final_assignment = Assignment(
            id=assignment_id,
            title=payload.title,
            family=payload.family,
            description=payload.description,
            status=AssignmentStatus.DRAFT,
            created_by=user["id"],
            created_at=now,
            updated_at=now,
            session_defaults=user["preferences"]["defaultSessionPreferences"],
            verification_goals=understanding.verification_goals,
            ai_summary=understanding.assignment_summary,
            ai_summary_confidence=0.86,
            assignment_understanding=understanding,
            artifact_count=0,
            case_count=0,
            completed_session_count=0,
            pending_review_count=0,
        )
        record = {**final_assignment.model_dump(by_alias=True), "artifacts": [], "imports": [], "cases": []}
        data["assignments"].insert(0, record)
        self._add_activity(
            data,
            DashboardActivity(
                id=f"activity_assignment_{assignment_id}",
                type="generated_cases",
                title=f"Created assignment {payload.title}",
                detail="Assignment workspace is ready for artifacts and student submissions.",
                assignment_id=assignment_id,
                created_at=now,
            ).model_dump(by_alias=True),
        )
        self.repository.save(data)
        return deepcopy(record)

    def get_assignment(self, assignment_id: str, token: str | None = None) -> dict:
        _ = self.resolve_user(token)
        data = self.repository.load()
        assignment = DemoRepository.find_assignment(data, assignment_id)
        if not assignment:
            raise KeyError("assignment_not_found")
        return deepcopy(assignment)

    def update_assignment(self, assignment_id: str, payload: UpdateAssignmentRequest, token: str | None = None) -> dict:
        _ = self.resolve_user(token)
        data = self.repository.load()
        assignment = self._require_assignment(data, assignment_id)
        if payload.title is not None:
            assignment["title"] = payload.title
        if payload.description is not None:
            assignment["description"] = payload.description
        if payload.status is not None:
            assignment["status"] = payload.status
        if payload.verification_goals is not None:
            assignment["verificationGoals"] = payload.verification_goals
        if payload.session_defaults is not None:
            assignment["sessionDefaults"] = payload.session_defaults.model_dump(by_alias=True)
        assignment["updatedAt"] = now_iso()
        self._sync_assignment_metrics(assignment)
        self.repository.save(data)
        return deepcopy(assignment)

    def archive_assignment(self, assignment_id: str, token: str | None = None) -> dict:
        data = self.repository.load()
        assignment = self._require_assignment(data, assignment_id)
        assignment["status"] = "archived"
        assignment["updatedAt"] = now_iso()
        self.repository.save(data)
        return deepcopy(assignment)

    def create_assignment_artifact_upload_target(self, assignment_id: str, payload: UploadUrlRequest, token: str | None = None) -> dict:
        _ = self.resolve_user(token)
        _ = self.get_assignment(assignment_id, token)
        target = self.storage.create_upload_target(
            namespace=f"{assignment_id}/assignment-artifacts",
            file_name=payload.file_name,
            mime_type=payload.mime_type,
        )
        return {
            "uploadId": target.upload_id,
            "uploadUrl": target.upload_url,
            "storagePath": target.storage_path,
            "headers": target.headers,
        }

    def register_assignment_artifact(self, assignment_id: str, payload: RegisterArtifactRequest, token: str | None = None) -> dict:
        _ = self.resolve_user(token)
        data = self.repository.load()
        assignment = self._require_assignment(data, assignment_id)
        material = StorageMaterializer(self.storage).for_path(payload.storage_path)
        text = material.text
        classification = self.ai.classify_artifact(
            file_name=payload.file_name,
            mime_type=payload.mime_type,
            text_preview=text,
            is_student=False,
        )
        sections = material.sections or extract_sections(payload.file_name)
        role = classification.role
        artifact = Artifact(
            id=f"artifact_{assignment_id}_{uuid4().hex[:10]}",
            file_name=payload.file_name,
            storage_path=payload.storage_path,
            mime_type=payload.mime_type,
            original_size=payload.original_size,
            role=role,
            detected_role=role,
            role_confidence=classification.confidence,
            extracted_text=text,
            extracted_structure=sections,
            preview_metadata=self._preview_metadata_for(role, payload.file_name, text, sections),
            created_at=now_iso(),
            explainability=classification.as_explainability(),
        )
        assignment.setdefault("artifacts", []).append(artifact.model_dump(by_alias=True))
        self._sync_assignment_metrics(assignment)
        self.repository.save(data)
        return artifact.model_dump(by_alias=True)

    def list_assignment_artifacts(self, assignment_id: str, token: str | None = None) -> list[dict]:
        assignment = self.get_assignment(assignment_id, token)
        return assignment.get("artifacts", [])

    def update_assignment_artifact(self, assignment_id: str, artifact_id: str, payload: dict, token: str | None = None) -> dict:
        data = self.repository.load()
        assignment = self._require_assignment(data, assignment_id)
        artifact = next((item for item in assignment.get("artifacts", []) if item["id"] == artifact_id), None)
        if not artifact:
            raise KeyError("artifact_not_found")
        if "role" in payload:
            artifact["role"] = payload["role"]
        if "detectedRole" in payload:
            artifact["detectedRole"] = payload["detectedRole"]
        assignment["updatedAt"] = now_iso()
        self.repository.save(data)
        return deepcopy(artifact)

    def analyze_assignment_artifacts(self, assignment_id: str, token: str | None = None) -> dict:
        data = self.repository.load()
        assignment = self._require_assignment(data, assignment_id)
        artifacts = [Artifact.model_validate(item) for item in assignment.get("artifacts", [])]
        assignment_model = Assignment.model_validate({key: value for key, value in assignment.items() if key not in {"artifacts", "imports", "cases"}})
        understanding = self.ai.understand_assignment(assignment_model, artifacts)
        assignment["assignmentUnderstanding"] = understanding.model_dump(by_alias=True)
        assignment["aiSummary"] = understanding.assignment_summary
        assignment["aiSummaryConfidence"] = 0.91 if artifacts else 0.78
        assignment["verificationGoals"] = [goal.model_dump(by_alias=True) for goal in understanding.verification_goals]
        assignment["status"] = "ready" if artifacts else "draft"
        assignment["updatedAt"] = now_iso()
        self._sync_assignment_metrics(assignment)
        self.repository.save(data)
        return deepcopy(assignment)

    def create_import_upload_target(self, assignment_id: str, payload: UploadUrlRequest, token: str | None = None) -> dict:
        _ = self.get_assignment(assignment_id, token)
        target = self.storage.create_upload_target(
            namespace=f"{assignment_id}/imports",
            file_name=payload.file_name,
            mime_type=payload.mime_type,
        )
        return {
            "uploadId": target.upload_id,
            "uploadUrl": target.upload_url,
            "storagePath": target.storage_path,
            "headers": target.headers,
        }

    def register_import_batch(self, assignment_id: str, payload: RegisterImportBatchRequest, token: str | None = None) -> dict:
        user = self.resolve_user(token)
        data = self.repository.load()
        assignment = self._require_assignment(data, assignment_id)
        materializer = StorageMaterializer(self.storage)
        items = []
        for request_item in payload.items:
            text = materializer.for_path(request_item.storage_path).text
            classification = self.ai.classify_artifact(
                file_name=request_item.file_name,
                mime_type=request_item.mime_type or detect_mime_from_name(request_item.file_name),
                text_preview=text,
                is_student=True,
            )
            detected_student = extract_student_identifier(request_item.file_name)
            items.append(
                ImportItem(
                    id=f"import_item_{uuid4().hex[:10]}",
                    file_name=request_item.file_name,
                    storage_path=request_item.storage_path,
                    detected_student_identifier=detected_student,
                    matched_student_identifier=detected_student,
                    detected_role=classification.role,
                    confidence=classification.confidence,
                    bundle_id=f"bundle_{detected_student.lower()}" if detected_student else None,
                    unresolved_reason=None if detected_student else "Unable to infer a student identifier from the uploaded file.",
                    created_at=now_iso(),
                ).model_dump(by_alias=True)
            )
        import_job = ImportJob(
            id=f"import_{uuid4().hex[:8]}",
            created_at=now_iso(),
            created_by=user["id"],
            status=ImportStatus.UPLOADING,
            source_type=payload.source_type,
            roster_csv_path=payload.roster_csv_path,
            files_count=len(items),
            detected_students_count=len({item["matchedStudentIdentifier"] for item in items if item.get("matchedStudentIdentifier")}),
            unresolved_items_count=sum(1 for item in items if item.get("unresolvedReason")),
            stage_labels=[
                "uploading",
                "classifying files",
                "detecting student identifiers",
                "grouping bundles",
                "creating cases",
            ],
            imported_artifacts=[ImportItem.model_validate(item) for item in items],
            detected_bundles=[],
        )
        assignment.setdefault("imports", []).insert(0, import_job.model_dump(by_alias=True))
        assignment["updatedAt"] = now_iso()
        self.repository.save(data)
        return import_job.model_dump(by_alias=True)

    def get_import(self, assignment_id: str, import_id: str, token: str | None = None) -> dict:
        assignment = self.get_assignment(assignment_id, token)
        import_job = next((item for item in assignment.get("imports", []) if item["id"] == import_id), None)
        if not import_job:
            raise KeyError("import_not_found")
        return import_job

    def analyze_import(self, assignment_id: str, import_id: str, token: str | None = None) -> dict:
        data = self.repository.load()
        assignment = self._require_assignment(data, assignment_id)
        import_job = self._require_import(assignment, import_id)
        assignment_model = self._assignment_model(assignment)
        materializer = StorageMaterializer(self.storage)
        pseudo_artifacts = []
        for item in import_job.get("importedArtifacts", []):
            material = materializer.for_path(item["storagePath"])
            sections = material.sections or extract_sections(item["fileName"])
            pseudo_artifacts.append(
                Artifact(
                    id=item["id"],
                    file_name=item["fileName"],
                    storage_path=item["storagePath"],
                    mime_type=detect_mime_from_name(item["fileName"]),
                    original_size=material.size_bytes,
                    role=item["detectedRole"],
                    detected_role=item["detectedRole"],
                    role_confidence=item["confidence"],
                    extracted_text=material.text,
                    extracted_structure=sections,
                    preview_metadata=self._preview_metadata_for(item["detectedRole"], item["fileName"], material.text, sections),
                    created_at=item["createdAt"],
                )
            )
        grouping = self.ai.group_student_bundles(assignment=assignment_model, artifacts=pseudo_artifacts, roster_text=None)
        import_job["detectedBundles"] = [
            ImportBundle(
                bundle_id=item["bundleId"],
                student_identifier=item["studentIdentifier"],
                student_name=item.get("studentName"),
                student_email=item.get("studentEmail"),
                file_count=len(item["artifactIds"]),
                submission_family=item["submissionFamily"],
                confidence=item["confidence"],
                unresolved=False,
            ).model_dump(by_alias=True)
            for item in grouping.bundles
        ]
        bundle_map = {bundle["bundleId"]: bundle for bundle in grouping.bundles}
        for item in import_job.get("importedArtifacts", []):
            detected_student = item.get("matchedStudentIdentifier") or item.get("detectedStudentIdentifier")
            if detected_student:
                item["matchedStudentIdentifier"] = detected_student
                item["bundleId"] = f"bundle_{detected_student.lower()}"
                item["unresolvedReason"] = None
            elif grouping.unresolved_items:
                item["unresolvedReason"] = "Manual mapping required."
        import_job["detectedStudentsCount"] = len(import_job["detectedBundles"])
        import_job["unresolvedItemsCount"] = sum(1 for item in import_job["importedArtifacts"] if item.get("unresolvedReason"))
        import_job["status"] = "blocked" if import_job["unresolvedItemsCount"] else "ready"
        assignment["updatedAt"] = now_iso()
        self.repository.save(data)
        return deepcopy(import_job)

    def fix_import_mapping(self, assignment_id: str, import_id: str, import_item_id: str, matched_student_identifier: str, bundle_id: str | None, token: str | None = None) -> dict:
        data = self.repository.load()
        assignment = self._require_assignment(data, assignment_id)
        import_job = self._require_import(assignment, import_id)
        item = next((artifact for artifact in import_job["importedArtifacts"] if artifact["id"] == import_item_id), None)
        if not item:
            raise KeyError("import_item_not_found")
        item["matchedStudentIdentifier"] = matched_student_identifier
        item["bundleId"] = bundle_id or f"bundle_{matched_student_identifier.lower()}"
        item["unresolvedReason"] = None
        existing_bundle = next((entry for entry in import_job["detectedBundles"] if entry["bundleId"] == item["bundleId"]), None)
        if not existing_bundle:
            import_job["detectedBundles"].append(
                ImportBundle(
                    bundle_id=item["bundleId"],
                    student_identifier=matched_student_identifier,
                    student_name=None,
                    student_email=None,
                    file_count=1,
                    submission_family=assignment["family"],
                    confidence=0.72,
                    unresolved=False,
                ).model_dump(by_alias=True)
            )
        import_job["unresolvedItemsCount"] = sum(1 for artifact in import_job["importedArtifacts"] if artifact.get("unresolvedReason"))
        import_job["status"] = "ready" if import_job["unresolvedItemsCount"] == 0 else import_job["status"]
        self.repository.save(data)
        return deepcopy(import_job)

    def create_cases_from_import(self, assignment_id: str, import_id: str, token: str | None = None) -> dict:
        data = self.repository.load()
        assignment = self._require_assignment(data, assignment_id)
        import_job = self._require_import(assignment, import_id)
        materializer = StorageMaterializer(self.storage)
        grouped: dict[str, list[dict]] = {}
        for item in import_job["importedArtifacts"]:
            if item.get("unresolvedReason"):
                continue
            key = item.get("bundleId") or f"bundle_{item['matchedStudentIdentifier'].lower()}"
            grouped.setdefault(key, []).append(item)
        new_cases = []
        for bundle_id, items in grouped.items():
            student_identifier = items[0].get("matchedStudentIdentifier") or items[0].get("detectedStudentIdentifier")
            bundle_artifacts = []
            for item in items:
                material = materializer.for_path(item["storagePath"])
                text = material.text
                sections = material.sections or extract_sections(item["fileName"])
                bundle_artifacts.append(
                    BundleArtifact(
                        id=f"bundle_artifact_{uuid4().hex[:10]}",
                        file_name=item["fileName"],
                        storage_path=item["storagePath"],
                        role=item["detectedRole"],
                        extracted_text=text,
                        extracted_structure=sections,
                        preview_metadata=self._preview_metadata_for(item["detectedRole"], item["fileName"], text, sections),
                        created_at=now_iso(),
                    )
                )
            case_record = self._build_case_from_bundle(
                assignment=assignment,
                student_identifier=student_identifier or f"student_{uuid4().hex[:5]}",
                student_name=items[0].get("matchedStudentIdentifier"),
                bundle=bundle_artifacts,
            )
            self._upsert_case(assignment, case_record)
            new_cases.append(case_record)
        import_job["status"] = "completed"
        assignment["status"] = "ready"
        assignment["updatedAt"] = now_iso()
        self._sync_assignment_metrics(assignment)
        self._add_activity(
            data,
            DashboardActivity(
                id=f"activity_cases_{import_id}",
                type="generated_cases",
                title=f"Generated cases for {assignment['title']}",
                detail=f"{len(new_cases)} student cases are ready for oral verification.",
                assignment_id=assignment_id,
                created_at=now_iso(),
            ).model_dump(by_alias=True),
        )
        self.repository.save(data)
        return {"cases": new_cases, "assignment": deepcopy(assignment)}

    def list_cases(self, assignment_id: str, token: str | None = None) -> list[dict]:
        assignment = self.get_assignment(assignment_id, token)
        return sorted(assignment.get("cases", []), key=lambda case: case["updatedAt"], reverse=True)

    def get_case(self, case_id: str, token: str | None = None) -> dict:
        _ = self.resolve_user(token)
        data = self.repository.load()
        assignment, case = DemoRepository.find_case(data, case_id)
        if not case or not assignment:
            raise KeyError("case_not_found")
        return {
            "assignment": deepcopy({key: value for key, value in assignment.items() if key not in {"cases", "imports"}}),
            "case": deepcopy(case),
        }

    def regenerate_session_link(self, case_id: str, token: str | None = None) -> dict:
        data = self.repository.load()
        assignment, case = self._require_case(data, case_id)
        token_value = f"session_{uuid4().hex}"
        case["sessionLinkToken"] = token_value
        case["session"]["token"] = token_value
        case["session"]["status"] = "sent"
        case["sessionStatus"] = "sent"
        assignment["updatedAt"] = now_iso()
        self.repository.save(data)
        return {"token": token_value, "case": deepcopy(case)}

    def refresh_case_analysis(self, case_id: str, token: str | None = None) -> dict:
        data = self.repository.load()
        assignment, case = self._require_case(data, case_id)
        bundle = [BundleArtifact.model_validate(item) for item in case["bundleArtifacts"]]
        assignment_model = Assignment.model_validate({key: value for key, value in assignment.items() if key not in {"cases", "imports", "artifacts"}})
        case_model = Case.model_validate({key: value for key, value in case.items() if key not in {"bundleArtifacts", "session", "questions", "responses", "result"}})
        submission_summary, focus_points, concerns = self.ai.extract_focus_points(
            assignment=assignment_model,
            case=case_model,
            bundle_artifacts=[
                Artifact(
                    id=item.id,
                    file_name=item.file_name,
                    storage_path=item.storage_path,
                    mime_type=detect_mime_from_name(item.file_name),
                    original_size=len(item.extracted_text.encode("utf-8")),
                    role=item.role,
                    detected_role=item.role,
                    role_confidence=0.9,
                    extracted_text=item.extracted_text,
                    extracted_structure=item.extracted_structure,
                    preview_metadata=item.preview_metadata,
                    created_at=item.created_at,
                )
                for item in bundle
            ],
        )
        case_model.focus_points = focus_points
        case_model.generated_questions = self.ai.generate_questions(
            assignment=assignment_model,
            case=case_model,
            focus_points=focus_points,
        )
        case_model.preview_flags = self.ai.build_preview_flags(case=case_model, concerns=concerns)
        case_model.preview_summary = f"{len(focus_points)} focus points generated · {len(concerns)} flagged areas · summary ready"
        case.update(case_model.model_dump(by_alias=True))
        case["questions"] = [question.model_dump(by_alias=True) for question in case_model.generated_questions]
        if case.get("responses"):
            result = self.ai.synthesize_result(
                assignment=assignment_model,
                case=case_model,
                responses=[CaseResponse.model_validate(item) for item in case["responses"]],
                focus_points=focus_points,
                questions=case_model.generated_questions,
            )
            case["result"] = result.model_dump(by_alias=True)
        assignment["updatedAt"] = now_iso()
        self.repository.save(data)
        return deepcopy(case)

    def get_session(self, token_value: str) -> dict:
        data = self.repository.load()
        assignment, case = DemoRepository.find_case_by_token(data, token_value)
        if not case or not assignment:
            raise KeyError("session_not_found")
        return {
            "assignment": {
                "id": assignment["id"],
                "title": assignment["title"],
                "family": assignment["family"],
                "summary": assignment["aiSummary"],
                "verificationGoals": assignment["verificationGoals"],
                "assignmentUnderstanding": assignment["assignmentUnderstanding"],
            },
            "case": {
                "id": case["id"],
                "studentIdentifier": case["studentIdentifier"],
                "studentName": case.get("studentName"),
                "submissionFamily": case["submissionFamily"],
                "previewSummary": case["previewSummary"],
                "focusPoints": case["focusPoints"],
            },
            "session": deepcopy(case["session"]),
            "questions": deepcopy(case.get("questions", [])),
            "bundleArtifacts": deepcopy(case.get("bundleArtifacts", [])),
            "responses": deepcopy(case.get("responses", [])),
            "completion": self._completion_payload(case),
        }

    def start_session(self, token_value: str) -> dict:
        data = self.repository.load()
        assignment, case = self._require_case_by_token(data, token_value)
        if case["session"].get("completedAt"):
            return deepcopy(case["session"])
        now = now_iso()
        case["session"]["startedAt"] = case["session"].get("startedAt") or now
        case["session"]["status"] = "in_progress"
        case["sessionStatus"] = "in_progress"
        assignment["updatedAt"] = now
        self.repository.save(data)
        return deepcopy(case["session"])

    def create_session_response_upload_target(self, token_value: str, payload: UploadUrlRequest) -> dict:
        _ = self.get_session(token_value)
        target = self.storage.create_upload_target(
            namespace=f"responses/{token_value}",
            file_name=payload.file_name,
            mime_type=payload.mime_type,
        )
        return {
            "uploadId": target.upload_id,
            "uploadUrl": target.upload_url,
            "storagePath": target.storage_path,
            "headers": target.headers,
        }

    def submit_response(self, token_value: str, question_id: str, audio_path: str, video_path: str | None, duration_seconds: int) -> dict:
        data = self.repository.load()
        assignment, case = self._require_case_by_token(data, token_value)
        if case["session"].get("completedAt"):
            raise ValueError("session_already_completed")
        question = next((item for item in case.get("questions", []) if item["id"] == question_id), None)
        if not question:
            raise KeyError("question_not_found")
        existing_response = next((item for item in case.get("responses", []) if item["questionId"] == question_id), None)
        if existing_response and not case.get("session", {}).get("allowRerecord", True):
            raise ValueError("rerecord_not_allowed")
        generated_question = GeneratedQuestion.model_validate(question)
        case_model = self._case_model(case)
        transcription_audio_path = self.storage.speech_uri_for(audio_path) or audio_path
        transcription = self.speech.transcribe(
            case=case_model,
            question=generated_question,
            audio_path=transcription_audio_path,
        )
        response = CaseResponse(
            id=f"response_{uuid4().hex[:12]}",
            question_id=question_id,
            audio_path=audio_path,
            video_path=video_path,
            transcript_text=transcription.transcript_text,
            transcript_confidence=transcription.confidence,
            answer_summary="",
            duration_seconds=duration_seconds,
            summary=ResponseSummary(
                answer_summary="",
                evidence_quality="medium",  # type: ignore[arg-type]
                signals=[],
                confidence=0.0,
            ),
            created_at=now_iso(),
        )
        response = self.ai.summarize_response(
            assignment=self._assignment_model(assignment),
            case=case_model,
            question=generated_question,
            response=response,
            related_sources=generated_question.source_refs,
        )
        case.setdefault("responses", [])
        case["responses"] = [item for item in case["responses"] if item["questionId"] != question_id]
        case["responses"].append(response.model_dump(by_alias=True))
        case["session"]["status"] = "in_progress"
        case["sessionStatus"] = "in_progress"
        case["updatedAt"] = now_iso()
        assignment["updatedAt"] = case["updatedAt"]
        self.repository.save(data)
        return response.model_dump(by_alias=True)

    def complete_session(self, token_value: str) -> dict:
        data = self.repository.load()
        assignment, case = self._require_case_by_token(data, token_value)
        if case.get("result") and case["session"].get("completedAt"):
            return deepcopy(case["result"])
        completion_state = self._completion_state(case)
        if not completion_state.can_complete:
            raise ValueError("session_incomplete")
        assignment_model = self._assignment_model(assignment)
        case_model = self._case_model(case)
        questions = [GeneratedQuestion.model_validate(item) for item in case.get("questions", [])]
        result = self.ai.synthesize_result(
            assignment=assignment_model,
            case=case_model,
            responses=[CaseResponse.model_validate(item) for item in case.get("responses", [])],
            focus_points=case_model.focus_points,
            questions=questions,
        )
        case["result"] = result.model_dump(by_alias=True)
        case["session"]["status"] = "summary_ready"
        case["session"]["completedAt"] = now_iso()
        case["sessionStatus"] = "summary_ready"
        case["reviewStatus"] = "needs_review"
        case["updatedAt"] = now_iso()
        assignment["updatedAt"] = case["updatedAt"]
        self._sync_assignment_metrics(assignment)
        self._add_activity(
            data,
            DashboardActivity(
                id=f"activity_complete_{case['id']}",
                type="completed_session",
                title=f"{case.get('studentName') or case['studentIdentifier']} completed oral verification",
                detail=case["previewSummary"],
                assignment_id=assignment["id"],
                case_id=case["id"],
                created_at=case["updatedAt"],
            ).model_dump(by_alias=True),
        )
        self.repository.save(data)
        return deepcopy(case["result"])

    def get_result(self, case_id: str, token: str | None = None) -> dict:
        _ = self.resolve_user(token)
        data = self.repository.load()
        assignment, case = self._require_case(data, case_id)
        if not case.get("result") and case.get("responses"):
            if self._completion_state(case).can_complete:
                self.complete_session(case["sessionLinkToken"])
                data = self.repository.load()
                assignment, case = self._require_case(data, case_id)
        return {
            "assignment": deepcopy({key: value for key, value in assignment.items() if key not in {"cases", "imports"}}),
            "case": deepcopy(case),
            "result": deepcopy(case.get("result")),
        }

    def update_review_note(self, case_id: str, payload: ReviewNoteRequest, token: str | None = None) -> dict:
        user = self.resolve_user(token)
        data = self.repository.load()
        assignment, case = self._require_case(data, case_id)
        if not case.get("result"):
            raise KeyError("result_not_found")
        case["result"]["finalReviewerNote"] = payload.final_reviewer_note
        case["result"]["reviewedBy"] = user["id"]
        assignment["updatedAt"] = now_iso()
        self.repository.save(data)
        return deepcopy(case["result"])

    def mark_reviewed(self, case_id: str, token: str | None = None) -> dict:
        user = self.resolve_user(token)
        data = self.repository.load()
        assignment, case = self._require_case(data, case_id)
        if not case.get("result"):
            raise KeyError("result_not_found")
        now = now_iso()
        case["result"]["reviewedAt"] = now
        case["result"]["reviewedBy"] = user["id"]
        case["reviewStatus"] = "reviewed"
        case["updatedAt"] = now
        assignment["updatedAt"] = now
        self._sync_assignment_metrics(assignment)
        self._add_activity(
            data,
            DashboardActivity(
                id=f"activity_review_{case_id}",
                type="reviewed_case",
                title=f"Reviewed {case.get('studentName') or case['studentIdentifier']}",
                detail="Reviewer note saved and case marked as reviewed.",
                assignment_id=assignment["id"],
                case_id=case_id,
                created_at=now,
            ).model_dump(by_alias=True),
        )
        self.repository.save(data)
        return deepcopy(case["result"])

    def get_settings(self, token: str | None = None) -> SettingsPayload:
        user = self.resolve_user(token)
        return SettingsPayload(
            profile={
                "displayName": user["displayName"],
                "email": user["email"],
                "role": user["role"],
            },
            theme=user["preferences"]["theme"],
            default_session_preferences=user["preferences"]["defaultSessionPreferences"],
            demo_mode_helpers=user["preferences"]["demoModeHelpers"],
        )

    def update_settings(self, payload: UpdateSettingsRequest, token: str | None = None) -> SettingsPayload:
        user = self.resolve_user(token)
        data = self.repository.load()
        stored_user = DemoRepository.find_user(data, user["id"])
        if not stored_user:
            raise KeyError("user_not_found")
        if payload.theme is not None:
            stored_user["preferences"]["theme"] = payload.theme
        if payload.default_session_preferences is not None:
            stored_user["preferences"]["defaultSessionPreferences"] = payload.default_session_preferences.model_dump(by_alias=True)
        if payload.demo_mode_helpers is not None:
            stored_user["preferences"]["demoModeHelpers"] = payload.demo_mode_helpers
        stored_user["updatedAt"] = now_iso()
        self.repository.save(data)
        return self.get_settings(token)

    def save_uploaded_bytes(self, storage_path: str, content: bytes) -> None:
        self.storage.save_bytes(storage_path=storage_path, content=content)

    def _assignment_model(self, assignment: dict) -> Assignment:
        return Assignment.model_validate({key: value for key, value in assignment.items() if key not in {"artifacts", "imports", "cases"}})

    def _case_model(self, case: dict) -> Case:
        return Case.model_validate({key: value for key, value in case.items() if key not in {"bundleArtifacts", "session", "questions", "responses", "result"}})

    def _completion_state(self, case: dict):
        return build_session_completion_state(case.get("questions", []), case.get("responses", []))

    def _completion_payload(self, case: dict) -> dict:
        return self._completion_state(case).as_payload()

    def _build_case_from_bundle(self, *, assignment: dict, student_identifier: str, student_name: str | None, bundle: list[BundleArtifact]) -> dict:
        now = now_iso()
        assignment_model = self._assignment_model(assignment)
        case_model = Case(
            id=f"case_{assignment['id']}_{slugify(student_identifier)}",
            assignment_id=assignment["id"],
            student_identifier=student_identifier,
            student_name=student_name,
            student_email=f"{slugify(student_name or student_identifier)}@student.demo",
            submission_family=assignment["family"],
            bundle_artifact_ids=[artifact.id for artifact in bundle],
            ai_confidence=0.82,
            focus_points=[],
            generated_questions=[],
            session_link_token=f"session_{uuid4().hex}",
            session_status=SessionStatus.NOT_SENT,
            review_status=ReviewStatus.NOT_STARTED,
            preview_summary="",
            preview_flags=[],
            created_at=now,
            updated_at=now,
        )
        artifact_models = [
            Artifact(
                id=item.id,
                file_name=item.file_name,
                storage_path=item.storage_path,
                mime_type=detect_mime_from_name(item.file_name),
                original_size=len(item.extracted_text.encode("utf-8")),
                role=item.role,
                detected_role=item.role,
                role_confidence=0.88,
                extracted_text=item.extracted_text,
                extracted_structure=item.extracted_structure,
                preview_metadata=item.preview_metadata,
                created_at=item.created_at,
            )
            for item in bundle
        ]
        submission_summary, focus_points, concerns = self.ai.extract_focus_points(
            assignment=assignment_model,
            case=case_model,
            bundle_artifacts=artifact_models,
        )
        case_model.focus_points = focus_points
        case_model.generated_questions = self.ai.generate_questions(
            assignment=assignment_model,
            case=case_model,
            focus_points=focus_points,
        )
        preview_flags = self.ai.build_preview_flags(case=case_model, concerns=concerns)
        case_model.preview_flags = preview_flags
        case_model.preview_summary = f"{len(focus_points)} focus points generated · {len([flag for flag in preview_flags if flag.tone != 'neutral'])} flagged areas · summary ready"
        session = CaseSession(
            id=f"session_{case_model.id}",
            token=case_model.session_link_token,
            mode=assignment_model.session_defaults.response_mode,
            question_count=assignment_model.session_defaults.question_count,
            answer_duration_seconds=assignment_model.session_defaults.answer_duration_seconds,
            allow_rerecord=assignment_model.session_defaults.allow_rerecord,
            status=SessionStatus.NOT_SENT,
            started_at=None,
            completed_at=None,
        )
        case_record = case_model.model_dump(by_alias=True)
        case_record["bundleArtifacts"] = [item.model_dump(by_alias=True) for item in bundle]
        case_record["session"] = session.model_dump(by_alias=True)
        case_record["questions"] = [item.model_dump(by_alias=True) for item in case_model.generated_questions]
        case_record["responses"] = []
        case_record["result"] = None
        return case_record

    def _preview_metadata_for(self, role: str, file_name: str, text: str, sections: list) -> PreviewMetadata:
        kind = "document"
        if role == "visual_submission" or "slide" in file_name.lower() or "deck" in file_name.lower():
            kind = "slides"
        elif role == "technical_submission" or "notebook" in file_name.lower():
            kind = "technical"
        return PreviewMetadata(
            kind=kind,
            summary=(text[:140] + "...") if len(text) > 140 else text or f"Uploaded {file_name}",
            page_count=max(1, len(sections)),
            slide_count=len(sections) if kind == "slides" else None,
            highlighted_sections=[section.title for section in sections[:3]],
        )

    def _sync_assignment_metrics(self, assignment: dict) -> None:
        assignment["artifactCount"] = len(assignment.get("artifacts", []))
        assignment["caseCount"] = len(assignment.get("cases", []))
        assignment["completedSessionCount"] = sum(
            1
            for case in assignment.get("cases", [])
            if case.get("sessionStatus") in {"completed", "transcript_ready", "summary_ready"}
        )
        assignment["pendingReviewCount"] = sum(1 for case in assignment.get("cases", []) if case.get("reviewStatus") == "needs_review")

    def _upsert_case(self, assignment: dict, case_record: dict) -> None:
        assignment.setdefault("cases", [])
        assignment["cases"] = [case for case in assignment["cases"] if case["id"] != case_record["id"]]
        assignment["cases"].append(case_record)

    def _add_activity(self, data: dict, activity: dict) -> None:
        feed = data.setdefault("activityFeed", [])
        feed.insert(0, activity)
        del feed[12:]

    def _get_default_user(self, data: dict) -> dict:
        return deepcopy(DemoRepository.find_user(data, self.default_user_id) or data["users"][0])

    def _require_assignment(self, data: dict, assignment_id: str) -> dict:
        assignment = DemoRepository.find_assignment(data, assignment_id)
        if not assignment:
            raise KeyError("assignment_not_found")
        return assignment

    def _require_import(self, assignment: dict, import_id: str) -> dict:
        import_job = next((item for item in assignment.get("imports", []) if item["id"] == import_id), None)
        if not import_job:
            raise KeyError("import_not_found")
        return import_job

    def _require_case(self, data: dict, case_id: str) -> tuple[dict, dict]:
        assignment, case = DemoRepository.find_case(data, case_id)
        if not assignment or not case:
            raise KeyError("case_not_found")
        return assignment, case

    def _require_case_by_token(self, data: dict, token_value: str) -> tuple[dict, dict]:
        assignment, case = DemoRepository.find_case_by_token(data, token_value)
        if not assignment or not case:
            raise KeyError("session_not_found")
        return assignment, case

    def _init_firebase_auth(self):
        try:
            import firebase_admin
            from firebase_admin import auth, credentials
        except Exception:  # pragma: no cover
            return None
        if not (
            self.settings.firebase_project_id
            and self.settings.firebase_client_email
            and self.settings.firebase_private_key
        ):
            return None
        if not firebase_admin._apps:
            cred = credentials.Certificate(
                {
                    "type": "service_account",
                    "project_id": self.settings.firebase_project_id,
                    "client_email": self.settings.firebase_client_email,
                    "private_key": self.settings.firebase_private_key.replace("\\n", "\n"),
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            )
            firebase_admin.initialize_app(cred)
        return auth
