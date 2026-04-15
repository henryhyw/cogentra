from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: Literal["local", "docker", "test", "production"] = "local"
    app_name: str = "Oral Verification OS API"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://oralv:oralv@localhost:5432/oralv"
    redis_url: str = "redis://localhost:6379/0"
    minio_endpoint: str = "localhost:9000"
    minio_public_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "oralv-local"
    minio_secure: bool = False
    session_cookie_name: str = "oralv_session"
    csrf_cookie_name: str = "oralv_csrf"
    session_secret: str = Field(min_length=16, default="replace-with-32-char-secret")
    signing_secret: str = Field(min_length=16, default="replace-with-another-32-char-secret")
    default_llm_provider: str = "deterministic"
    default_embedding_provider: str = "hashing"
    default_asr_provider: str = "mock"
    openai_api_key: str = ""
    openai_model: str = "gpt-5-mini"
    asr_provider_api_key: str = ""
    task_always_eager: bool = False
    base_url: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
