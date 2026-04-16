from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


@dataclass
class UploadTarget:
    upload_id: str
    upload_url: str
    storage_path: str
    headers: dict[str, str]


class StorageProvider(ABC):
    @abstractmethod
    def create_upload_target(self, *, namespace: str, file_name: str, mime_type: str) -> UploadTarget:
        raise NotImplementedError

    @abstractmethod
    def save_bytes(self, *, storage_path: str, content: bytes) -> None:
        raise NotImplementedError

    @abstractmethod
    def read_text(self, storage_path: str) -> str:
        raise NotImplementedError

    @abstractmethod
    def local_path_for(self, storage_path: str) -> Path | None:
        raise NotImplementedError
