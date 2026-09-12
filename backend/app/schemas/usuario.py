"""
Schemas Pydantic v2 para la entidad Usuario.
"""

from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr


class RolUsuario(str, Enum):
    """Roles válidos del sistema."""
    USUARIO = "Usuario"
    SOPORTE = "Soporte"
    ADMINISTRADOR = "Administrador"


class UsuarioCreate(BaseModel):
    """Schema para crear un usuario (usado internamente tras OAuth)."""
    nombre: str
    email: EmailStr
    rol: RolUsuario = RolUsuario.USUARIO
    cargo: str | None = None
    area: str | None = None


class UsuarioUpdate(BaseModel):
    """Schema para actualizar datos de un usuario (Admin only)."""
    nombre: str | None = None
    rol: RolUsuario | None = None
    cargo: str | None = None
    area: str | None = None


class UsuarioResponse(BaseModel):
    """Schema de respuesta con datos del usuario."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    email: str
    rol: str
    cargo: str | None = None
    area: str | None = None
