from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Le Français Malin"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://francais:changeme@db:5432/francais_malin"

    # Auth
    secret_key: str = "change-this-secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # MLflow
    mlflow_tracking_uri: str = "http://mlflow:5000"
    mlflow_experiment_name: str = "francais-malin-evaluations"

    # CORS
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
