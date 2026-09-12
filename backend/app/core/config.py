"""
Configuración centralizada del backend.
Carga variables desde .env usando pydantic-settings.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración global de la aplicación."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # --- Base de Datos ---
    DATABASE_URL: str

    # --- Google OAuth 2.0 ---
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str = ""

    # --- JWT ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas

    # --- CORS ---
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # --- App ---
    APP_NAME: str = "NCP Tickets - Inversiones Oeding"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False


@lru_cache
def get_settings() -> Settings:
    """Singleton cacheado de la configuración."""
    return Settings()
