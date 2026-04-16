from __future__ import annotations

import hashlib
import re
from pathlib import Path


def stable_hash(*parts: str) -> int:
    digest = hashlib.sha256("::".join(parts).encode("utf-8")).hexdigest()
    return int(digest[:12], 16)


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return cleaned or "item"


def detect_mime_from_name(file_name: str) -> str:
    suffix = Path(file_name).suffix.lower()
    return {
        ".pdf": "application/pdf",
        ".md": "text/markdown",
        ".txt": "text/plain",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".webm": "audio/webm",
    }.get(suffix, "application/octet-stream")


def extract_student_identifier(file_name: str) -> str | None:
    patterns = [
        r"(S\d{4,8})",
        r"([A-Z]{2,4}\d{2,5})",
        r"([a-z]+\.[a-z]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, file_name)
        if match:
            return match.group(1)
    return None
