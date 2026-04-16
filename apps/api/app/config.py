from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    concentra_mode: str = Field(default="auto", alias="CONCENTRA_MODE")
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    app_base_url: str = Field(default="http://localhost:3000", alias="APP_BASE_URL")
    demo_data_root: str = Field(default="demo-data", alias="DEMO_DATA_ROOT")
    demo_runtime_root: str = Field(default="apps/api/runtime", alias="DEMO_RUNTIME_ROOT")
    storage_provider: str = Field(default="auto", alias="STORAGE_PROVIDER")
    ai_provider: str = Field(default="auto", alias="AI_PROVIDER")
    speech_provider: str = Field(default="auto", alias="SPEECH_PROVIDER")
    queue_provider: str = Field(default="auto", alias="QUEUE_PROVIDER")
    firebase_project_id: str = Field(default="", alias="FIREBASE_PROJECT_ID")
    firebase_client_email: str = Field(default="", alias="FIREBASE_CLIENT_EMAIL")
    firebase_private_key: str = Field(default="", alias="FIREBASE_PRIVATE_KEY")
    firebase_web_api_key: str = Field(default="", alias="FIREBASE_WEB_API_KEY")
    vertex_project_id: str = Field(default="", alias="VERTEX_PROJECT_ID")
    vertex_location: str = Field(default="us-central1", alias="VERTEX_LOCATION")
    vertex_model_text: str = Field(default="gemini-2.0-flash", alias="VERTEX_MODEL_TEXT")
    vertex_model_multimodal: str = Field(default="gemini-2.0-flash", alias="VERTEX_MODEL_MULTIMODAL")
    gcs_bucket: str = Field(default="", alias="GCS_BUCKET")
    gcs_signed_url_expiry_seconds: int = Field(default=900, alias="GCS_SIGNED_URL_EXPIRY_SECONDS")
    cloud_tasks_project_id: str = Field(default="", alias="CLOUD_TASKS_PROJECT_ID")
    cloud_tasks_location: str = Field(default="", alias="CLOUD_TASKS_LOCATION")
    cloud_tasks_queue: str = Field(default="", alias="CLOUD_TASKS_QUEUE")
    google_application_credentials: str = Field(default="", alias="GOOGLE_APPLICATION_CREDENTIALS")
    demo_signing_secret: str = Field(default="concentra-demo-secret", alias="DEMO_SIGNING_SECRET")
    demo_seed: str = Field(default="concentra-v1", alias="DEMO_SEED")

    @property
    def project_root(self) -> Path:
        return Path(__file__).resolve().parents[3]

    @property
    def demo_data_path(self) -> Path:
        return self.project_root / self.demo_data_root

    @property
    def demo_runtime_path(self) -> Path:
        return self.project_root / self.demo_runtime_root

    @property
    def resolved_mode(self) -> str:
        if self.concentra_mode in {"demo", "google"}:
            return self.concentra_mode
        has_google = bool(
            self.vertex_project_id
            and self.gcs_bucket
            and self.firebase_project_id
            and self.google_application_credentials
        )
        return "google" if has_google else "demo"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
