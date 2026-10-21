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
    FRONTEND_URL: str = "http://localhost:5173"

    # --- Web Push (VAPID) ---
    VAPID_PUBLIC_KEY: str = "BN-VDRsj9NeT02m0aUDunGAe4mp5z-HtKMmpGUcpHFcoZQ80aiaXrJS0Rn9irw67UlbTzImWEls3ANPOMc7qyeA"
    VAPID_PRIVATE_KEY: str = ""
    VAPID_PRIVATE_KEY_PATH: str = "vapid_private.pem"
    VAPID_CLAIM_EMAIL: str = "mailto:soporte@nuevocolegiodelprado.edu.co"

    # --- Email Notifications (SMTP) ---
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "soporte@nuevocolegiodelprado.edu.co"
    SMTP_FROM_NAME: str = "NCP Tickets - Inversiones Oeding"
    SMTP_TLS: bool = True
    EMAIL_NOTIFICATIONS_ENABLED: bool = False


@lru_cache
def get_settings() -> Settings:
    """Singleton cacheado de la configuración."""
    return Settings()
