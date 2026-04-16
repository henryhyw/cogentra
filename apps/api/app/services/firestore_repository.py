from __future__ import annotations

from collections.abc import Iterable

from app.config import Settings
from app.services.demo_repository import DemoRepository
from app.services.seed import DemoSeedBuilder


class FirestoreRepository(DemoRepository):
    def __init__(self, settings: Settings):
        super().__init__(settings)
        try:
            from google.cloud import firestore
        except Exception:  # pragma: no cover
            self._client = None
        else:
            self._client = firestore.Client(project=settings.vertex_project_id or None)

    def ensure_seeded(self) -> None:
        if not self._client:
            return super().ensure_seeded()
        if any(self._client.collection("assignments").limit(1).stream()):
            return
        self.save(DemoSeedBuilder(self.settings).build())

    def load(self) -> dict:
        if not self._client:
            return super().load()
        self.ensure_seeded()
        return {
          "users": [doc.to_dict() for doc in self._client.collection("users").stream()],
          "assignments": [self._load_assignment(doc.id) for doc in self._client.collection("assignments").stream()],
          "auditEvents": [doc.to_dict() for doc in self._client.collection("auditEvents").stream()],
          "activityFeed": [doc.to_dict() for doc in self._client.collection("activityFeed").stream()],
        }

    def save(self, data: dict) -> None:
        if not self._client:
            return super().save(data)
        self._reset_collection("activityFeed")
        self._reset_collection("auditEvents")
        self._reset_collection("users")
        self._reset_collection("assignments")
        for user in data.get("users", []):
            self._client.collection("users").document(user["id"]).set(user)
        for event in data.get("auditEvents", []):
            self._client.collection("auditEvents").document(event["id"]).set(event)
        for activity in data.get("activityFeed", []):
            self._client.collection("activityFeed").document(activity["id"]).set(activity)
        for assignment in data.get("assignments", []):
            self._save_assignment(assignment)

    def reset(self) -> dict:
        dataset = DemoSeedBuilder(self.settings).build()
        self.save(dataset)
        return dataset

    def _load_assignment(self, assignment_id: str) -> dict:
        assignment_doc = self._client.collection("assignments").document(assignment_id).get().to_dict()
        assignment_doc["artifacts"] = [doc.to_dict() for doc in self._client.collection("assignments").document(assignment_id).collection("artifacts").stream()]
        assignment_doc["imports"] = []
        for import_doc in self._client.collection("assignments").document(assignment_id).collection("imports").stream():
            import_data = import_doc.to_dict()
            import_data["importedArtifacts"] = [
                doc.to_dict()
                for doc in self._client.collection("assignments").document(assignment_id).collection("imports").document(import_doc.id).collection("importedArtifacts").stream()
            ]
            assignment_doc["imports"].append(import_data)
        assignment_doc["cases"] = []
        for case_doc in self._client.collection("assignments").document(assignment_id).collection("cases").stream():
            case_data = case_doc.to_dict()
            case_ref = self._client.collection("assignments").document(assignment_id).collection("cases").document(case_doc.id)
            case_data["bundleArtifacts"] = [doc.to_dict() for doc in case_ref.collection("bundleArtifacts").stream()]
            case_data["session"] = next((doc.to_dict() for doc in case_ref.collection("session").stream()), None)
            case_data["questions"] = [doc.to_dict() for doc in case_ref.collection("questions").stream()]
            case_data["responses"] = [doc.to_dict() for doc in case_ref.collection("responses").stream()]
            case_data["result"] = next((doc.to_dict() for doc in case_ref.collection("result").stream()), None)
            assignment_doc["cases"].append(case_data)
        return assignment_doc

    def _save_assignment(self, assignment: dict) -> None:
        assignment_ref = self._client.collection("assignments").document(assignment["id"])
        assignment_ref.set({key: value for key, value in assignment.items() if key not in {"artifacts", "imports", "cases"}})
        for artifact in assignment.get("artifacts", []):
            assignment_ref.collection("artifacts").document(artifact["id"]).set(artifact)
        for import_job in assignment.get("imports", []):
            import_ref = assignment_ref.collection("imports").document(import_job["id"])
            import_ref.set({key: value for key, value in import_job.items() if key != "importedArtifacts"})
            for item in import_job.get("importedArtifacts", []):
                import_ref.collection("importedArtifacts").document(item["id"]).set(item)
        for case in assignment.get("cases", []):
            case_ref = assignment_ref.collection("cases").document(case["id"])
            case_ref.set({key: value for key, value in case.items() if key not in {"bundleArtifacts", "session", "questions", "responses", "result"}})
            for artifact in case.get("bundleArtifacts", []):
                case_ref.collection("bundleArtifacts").document(artifact["id"]).set(artifact)
            if case.get("session"):
                case_ref.collection("session").document(case["session"]["id"]).set(case["session"])
            for question in case.get("questions", []):
                case_ref.collection("questions").document(question["id"]).set(question)
            for response in case.get("responses", []):
                case_ref.collection("responses").document(response["id"]).set(response)
            if case.get("result"):
                case_ref.collection("result").document("current").set(case["result"])

    def _reset_collection(self, name: str) -> None:
        if not self._client:
            return
        collection = self._client.collection(name)
        for document in collection.stream():
            self._delete_document_recursive(document.reference)

    def _delete_document_recursive(self, reference) -> None:
        for child_collection in reference.collections():
            for child_doc in child_collection.stream():
                self._delete_document_recursive(child_doc.reference)
        reference.delete()
