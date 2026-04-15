# AI Pipeline

The AI architecture is deterministic-by-default and fully runnable without external providers.

Stages:

1. Artifact classification
2. Assignment, rubric, and submission normalization
3. Claim extraction
4. Focus point and ambiguity generation
5. Defense question generation
6. Follow-up branch generation
7. Transcript-aligned evidence synthesis
8. Reviewer summary synthesis

Every generation stores provider metadata, model name, prompt name, prompt version, latency, seed, and linked entity identifiers in `GenerationTrace`.

Default providers:

- `DeterministicLLMProvider`
- `HashingEmbeddingProvider`
- `MockASRProvider`

Optional providers can be added later by implementing the same interfaces and registering them in the provider registry.
