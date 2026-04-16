from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.models.domain import Case, GeneratedQuestion


@dataclass
class TranscriptionResult:
    transcript_text: str
    confidence: float
    signals: list[str]


class SpeechProvider(ABC):
    @abstractmethod
    def transcribe(self, *, case: Case, question: GeneratedQuestion, audio_path: str) -> TranscriptionResult:
        raise NotImplementedError
