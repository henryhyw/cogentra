from __future__ import annotations

import logging

from app.config import Settings
from app.models.domain import Case, GeneratedQuestion
from app.providers.speech.base import SpeechProvider, TranscriptionResult
from app.providers.speech.demo import DemoSpeechProvider

logger = logging.getLogger(__name__)


class GoogleSpeechProvider(SpeechProvider):
    def __init__(self, settings: Settings):
        self.settings = settings
        self._fallback = DemoSpeechProvider()
        try:
            from google.cloud import speech_v1p1beta1 as speech
        except Exception:  # pragma: no cover
            self._client = None
            logger.warning("Google Speech client import failed; google-mode transcription will not be available.")
        else:
            self._client = speech.SpeechClient()

    def transcribe(self, *, case: Case, question: GeneratedQuestion, audio_path: str) -> TranscriptionResult:
        if audio_path.startswith("seed-audio/"):
            return self._fallback.transcribe(case=case, question=question, audio_path=audio_path)
        if not self._client:
            logger.error("Google Speech transcription requested without an initialized Speech client.")
            raise RuntimeError("google_speech_unavailable")
        from google.cloud import speech_v1p1beta1 as speech

        uri = audio_path if audio_path.startswith("gs://") else None
        if not uri:
            logger.error("Google Speech requires a gs:// URI but received %s", audio_path)
            raise RuntimeError("google_speech_requires_gs_uri")
        config = speech.RecognitionConfig(
            enable_automatic_punctuation=True,
            language_code="en-US",
            model="latest_long",
        )
        audio = speech.RecognitionAudio(uri=uri)
        response = self._client.recognize(config=config, audio=audio)
        transcript = " ".join(
            result.alternatives[0].transcript for result in response.results if result.alternatives
        ).strip()
        if not transcript:
            logger.warning("Google Speech returned an empty transcript for %s", uri)
            return TranscriptionResult(transcript_text="", confidence=0.0, signals=["google-speech-empty"])
        confidence_values = [result.alternatives[0].confidence for result in response.results if result.alternatives]
        confidence = sum(confidence_values) / len(confidence_values) if confidence_values else 0.84
        return TranscriptionResult(transcript_text=transcript, confidence=confidence, signals=["google-speech"])
