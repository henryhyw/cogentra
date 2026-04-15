from datetime import timedelta
from io import BytesIO
from typing import BinaryIO

from minio import Minio

from oralv.config import get_settings


class StorageClient:
    def __init__(self) -> None:
        settings = get_settings()
        self.bucket = settings.minio_bucket
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

    def upload_bytes(self, object_name: str, data: bytes, content_type: str) -> str:
        stream: BinaryIO = BytesIO(data)
        self.client.put_object(
            self.bucket,
            object_name,
            data=stream,
            length=len(data),
            content_type=content_type,
        )
        return object_name

    def download_text(self, object_name: str) -> str:
        response = self.client.get_object(self.bucket, object_name)
        try:
            return response.read().decode("utf-8", errors="ignore")
        finally:
            response.close()
            response.release_conn()

    def download_bytes(self, object_name: str) -> bytes:
        response = self.client.get_object(self.bucket, object_name)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def signed_get_url(self, object_name: str, expiry_minutes: int = 30) -> str:
        return self.client.presigned_get_object(
            self.bucket,
            object_name,
            expires=timedelta(minutes=expiry_minutes),
        )
