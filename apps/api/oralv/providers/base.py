from dataclasses import dataclass
from typing import Protocol


@dataclass
class ProviderResult:
    text: str
    metadata: dict


class LLMProvider(Protocol):
    name: str
    model_name: str

    def generate(self, prompt_name: str, prompt_version: str, payload: dict) -> ProviderResult: ...


class EmbeddingProvider(Protocol):
    name: str
    model_name: str

    def embed(self, text: str) -> list[float]: ...


class ASRProvider(Protocol):
    name: str
    model_name: str

    def transcribe(self, filename: str, transcript_hint: str | None = None) -> ProviderResult: ...
