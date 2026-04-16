from __future__ import annotations

import json
from copy import deepcopy

from app.config import Settings
from app.services.seed import DemoSeedBuilder


class DemoRepository:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.store_path = settings.demo_runtime_path / "demo_store.json"

    def ensure_seeded(self) -> None:
        if self.store_path.exists():
            return
        builder = DemoSeedBuilder(self.settings)
        dataset = builder.build()
        builder.write_store(dataset)

    def load(self) -> dict:
        self.ensure_seeded()
        return json.loads(self.store_path.read_text("utf-8"))

    def save(self, data: dict) -> None:
        self.store_path.parent.mkdir(parents=True, exist_ok=True)
        self.store_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def snapshot(self) -> dict:
        return deepcopy(self.load())

    def reset(self) -> dict:
        builder = DemoSeedBuilder(self.settings)
        dataset = builder.build()
        builder.write_store(dataset)
        return dataset

    @staticmethod
    def find_assignment(data: dict, assignment_id: str) -> dict | None:
        return next((assignment for assignment in data["assignments"] if assignment["id"] == assignment_id), None)

    @staticmethod
    def find_case(data: dict, case_id: str) -> tuple[dict | None, dict | None]:
        for assignment in data["assignments"]:
            for case in assignment.get("cases", []):
                if case["id"] == case_id:
                    return assignment, case
        return None, None

    @staticmethod
    def find_case_by_token(data: dict, token: str) -> tuple[dict | None, dict | None]:
        for assignment in data["assignments"]:
            for case in assignment.get("cases", []):
                if case.get("sessionLinkToken") == token or case.get("session", {}).get("token") == token:
                    return assignment, case
        return None, None

    @staticmethod
    def find_user(data: dict, user_id: str) -> dict | None:
        return next((user for user in data["users"] if user["id"] == user_id), None)
