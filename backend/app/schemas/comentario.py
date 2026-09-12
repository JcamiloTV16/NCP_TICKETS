"""
Schemas Pydantic v2 para la entidad Comentario.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.usuario import UsuarioResponse


class ComentarioCreate(BaseModel):
    """Schema para agregar un comentario a un ticket."""
    comentario: str


class ComentarioResponse(BaseModel):
    """Schema de respuesta con datos del comentario y su autor."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    comentario: str
    fecha_creacion: datetime

    # Relación anidada — quién escribió el comentario
    usuario: UsuarioResponse
