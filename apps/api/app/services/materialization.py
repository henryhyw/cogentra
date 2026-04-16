from __future__ import annotations

from dataclasses import dataclass

from app.models.domain import ExtractedSection
from app.providers.storage.base import StorageProvider
from app.services.parsing import extract_sections


@dataclass(frozen=True)
class FileMaterial:
    text: str
    sections: list[ExtractedSection]
    size_bytes: int


class StorageMaterializer:
    def __init__(self, storage: StorageProvider):
        self.storage = storage
        self._cache: dict[str, FileMaterial] = {}

    def for_path(self, storage_path: str) -> FileMaterial:
        cached = self._cache.get(storage_path)
        if cached:
            return cached
        text = self.storage.read_text(storage_path)
        material = FileMaterial(
            text=text,
            sections=extract_sections(text),
            size_bytes=len(text.encode("utf-8")),
        )
        self._cache[storage_path] = material
        return material
