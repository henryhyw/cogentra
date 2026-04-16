from __future__ import annotations

from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

from app.config import Settings
from app.providers.storage.base import StorageProvider, UploadTarget


class DemoStorageProvider(StorageProvider):
    def __init__(self, settings: Settings):
        self.settings = settings
        self.root = settings.demo_runtime_path / "storage"
        self.root.mkdir(parents=True, exist_ok=True)

    def create_upload_target(self, *, namespace: str, file_name: str, mime_type: str) -> UploadTarget:
        upload_id = uuid4().hex
        safe_name = file_name.replace("/", "-")
        storage_path = f"{namespace}/{upload_id}-{safe_name}"
        encoded = quote(storage_path, safe="")
        return UploadTarget(
            upload_id=upload_id,
            upload_url=f"http://localhost:{self.settings.api_port}/api/uploads/{upload_id}?storage_path={encoded}",
            storage_path=storage_path,
            headers={"Content-Type": mime_type or "application/octet-stream"},
        )

    def save_bytes(self, *, storage_path: str, content: bytes) -> None:
        target = self.root / storage_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)

    def read_text(self, storage_path: str) -> str:
        path = self.root / storage_path
        if not path.exists():
            return ""
        try:
            return path.read_text("utf-8")
        except UnicodeDecodeError:
            return ""

    def local_path_for(self, storage_path: str) -> Path | None:
        path = self.root / storage_path
        return path if path.exists() else path

    def speech_uri_for(self, storage_path: str) -> str | None:
        return storage_path
