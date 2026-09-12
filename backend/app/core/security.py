"""
Utilidades de seguridad: verificación de Google ID Token y manejo de JWT interno.
"""

from datetime import datetime, timedelta, timezone

import httpx
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()

# ─── Google Token Verification ────────────────────────────────────────────────

GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


async def verify_google_token(token: str) -> dict | None:
    """
    Verifica un Google ID Token contra el endpoint de Google.
    Retorna el payload (email, name, etc.) o None si es inválido.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_TOKENINFO_URL,
            params={"id_token": token},
        )

    if response.status_code != 200:
        return None

    payload = response.json()

    # Validar que el token fue emitido para nuestro client_id
    if payload.get("aud") != settings.GOOGLE_CLIENT_ID:
        return None

    # Validar que el email está verificado
    if payload.get("email_verified") != "true":
        return None

    return payload


# ─── JWT Interno ──────────────────────────────────────────────────────────────


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Genera un JWT interno con los claims proporcionados.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Decodifica y valida un JWT interno.
    Retorna los claims o None si es inválido/expirado.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
