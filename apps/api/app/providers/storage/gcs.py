from __future__ import annotations

from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

from app.config import Settings
from app.providers.storage.base import StorageProvider, UploadTarget
from app.providers.storage.demo import DemoStorageProvider


class GCSStorageProvider(StorageProvider):
    def __init__(self, settings: Settings):
        self.settings = settings
        self._fallback = DemoStorageProvider(settings)
        try:
            from google.cloud import storage
        except Exception:  # pragma: no cover
            self._client = None
            self._bucket = None
        else:
            self._client = storage.Client(project=settings.vertex_project_id or None)
            self._bucket = self._client.bucket(settings.gcs_bucket) if settings.gcs_bucket else None

    def create_upload_target(self, *, namespace: str, file_name: str, mime_type: str) -> UploadTarget:
        if not self._bucket:
            return self._fallback.create_upload_target(namespace=namespace, file_name=file_name, mime_type=mime_type)
        upload_id = uuid4().hex
        safe_name = file_name.replace("/", "-")
        storage_path = f"{namespace}/{upload_id}-{safe_name}"
        blob = self._bucket.blob(storage_path)
        url = blob.generate_signed_url(
            expiration=self.settings.gcs_signed_url_expiry_seconds,
            method="PUT",
            content_type=mime_type or "application/octet-stream",
        )
        return UploadTarget(
            upload_id=upload_id,
            upload_url=url,
            storage_path=storage_path,
            headers={"Content-Type": mime_type or "application/octet-stream"},
        )

    def save_bytes(self, *, storage_path: str, content: bytes) -> None:
        if not self._bucket:
            self._fallback.save_bytes(storage_path=storage_path, content=content)
            return
        self._bucket.blob(storage_path).upload_from_string(content)

    def read_text(self, storage_path: str) -> str:
        if not self._bucket:
            return self._fallback.read_text(storage_path)
        blob = self._bucket.blob(storage_path)
        if not blob.exists():
            return ""
        try:
            return blob.download_as_text()
        except Exception:
            return ""

    def local_path_for(self, storage_path: str) -> Path | None:
        if self._bucket:
          return None
        return self._fallback.local_path_for(storage_path)
