from oralv.config import get_settings
from oralv.providers.deterministic import DeterministicLLMProvider, HashingEmbeddingProvider, MockASRProvider


class ProviderRegistry:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.llms = {"deterministic": DeterministicLLMProvider()}
        self.embeddings = {"hashing": HashingEmbeddingProvider()}
        self.asr = {"mock": MockASRProvider()}

    def llm(self):
        return self.llms[self.settings.default_llm_provider]

    def embedding(self):
        return self.embeddings[self.settings.default_embedding_provider]

    def asr_provider(self):
        return self.asr[self.settings.default_asr_provider]


registry = ProviderRegistry()
