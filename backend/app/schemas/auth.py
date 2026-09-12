"""
Schemas Pydantic v2 para autenticación (Google OAuth + JWT).
"""

from pydantic import BaseModel, EmailStr


class GoogleLoginRequest(BaseModel):
    """Payload del frontend con el token de Google."""
    google_token: str


class DevLoginRequest(BaseModel):
    """Payload para login de desarrollo/testing local."""
    email: EmailStr


class TokenResponse(BaseModel):
    """Respuesta con el JWT interno tras autenticación exitosa."""
    access_token: str
    token_type: str = "bearer"


class CompleteProfileRequest(BaseModel):
    """Payload para completar el perfil de primer ingreso."""
    cargo: str
    area: str
