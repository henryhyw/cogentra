from __future__ import annotations

import logging
from pathlib import Path
from uuid import uuid4

from app.config import Settings
from app.providers.storage.base import StorageProvider, UploadTarget

logger = logging.getLogger(__name__)

class GCSStorageProvider(StorageProvider):
    def __init__(self, settings: Settings):
        self.settings = settings
        try:
            from google.cloud import storage
        except Exception:  # pragma: no cover
            self._client = None
            self._bucket = None
            logger.warning("GCS client import failed; google-mode storage will not be available.")
        else:
            self._client = storage.Client(project=settings.vertex_project_id or None)
            self._bucket = self._client.bucket(settings.gcs_bucket) if settings.gcs_bucket else None
            if not self._bucket:
                logger.warning("GCS bucket is not configured; google-mode storage will not be available.")

    def _require_bucket(self):
        if not self._bucket:
            raise RuntimeError("gcs_storage_unavailable")
        return self._bucket

    def create_upload_target(self, *, namespace: str, file_name: str, mime_type: str) -> UploadTarget:
        bucket = self._require_bucket()
        upload_id = uuid4().hex
        safe_name = file_name.replace("/", "-")
        storage_path = f"{namespace}/{upload_id}-{safe_name}"
        blob = bucket.blob(storage_path)
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
        bucket = self._require_bucket()
        bucket.blob(storage_path).upload_from_string(content)

    def read_text(self, storage_path: str) -> str:
        bucket = self._require_bucket()
        blob = bucket.blob(storage_path)
        if not blob.exists():
            return ""
        try:
            return blob.download_as_text()
        except Exception:
            return ""

    def local_path_for(self, storage_path: str) -> Path | None:
        _ = storage_path
        return None

    def speech_uri_for(self, storage_path: str) -> str | None:
        bucket = self._require_bucket()
        return f"gs://{bucket.name}/{storage_path}"
