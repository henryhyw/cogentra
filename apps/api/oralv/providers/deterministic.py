import hashlib
import json
from dataclasses import dataclass

from oralv.providers.base import ASRProvider, EmbeddingProvider, LLMProvider, ProviderResult


def _hash_chunks(seed: str, count: int = 64) -> list[float]:
    values: list[float] = []
    digest = hashlib.sha256(seed.encode()).hexdigest()
    while len(values) < count:
        for index in range(0, len(digest), 8):
            chunk = digest[index : index + 8]
            if len(chunk) < 8:
                continue
            value = (int(chunk, 16) % 2000) / 1000.0 - 1.0
            values.append(round(value, 6))
            if len(values) == count:
                break
        digest = hashlib.sha256(digest.encode()).hexdigest()
    return values


class DeterministicLLMProvider(LLMProvider):
    name = "deterministic"
    model_name = "deterministic-v1"

    def generate(self, prompt_name: str, prompt_version: str, payload: dict) -> ProviderResult:
        serialized = json.dumps(payload, sort_keys=True)
        seed = hashlib.sha256(f"{prompt_name}:{serialized}".encode()).hexdigest()
        return ProviderResult(
            text=seed,
            metadata={"seed": seed, "prompt_name": prompt_name, "prompt_version": prompt_version},
        )


class HashingEmbeddingProvider(EmbeddingProvider):
    name = "hashing"
    model_name = "hashing-64"

    def embed(self, text: str) -> list[float]:
        return _hash_chunks(text, 64)


class MockASRProvider(ASRProvider):
    name = "mock"
    model_name = "mock-asr-v1"

    def transcribe(self, filename: str, transcript_hint: str | None = None) -> ProviderResult:
        text = transcript_hint or (
            f"This is a simulated transcript for {filename}. The student explains intent, "
            "method, tradeoffs, and supporting evidence in a coherent sequence."
        )
        return ProviderResult(text=text, metadata={"confidence": 0.88, "source": "mock"})
