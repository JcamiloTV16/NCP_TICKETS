"""
Schemas Pydantic v2 para la entidad Ticket.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict

from app.schemas.usuario import UsuarioResponse


class EstadoTicket(str, Enum):
    """Estados válidos del flujo de tickets."""
    CREADO = "Creado"
    EN_EJECUCION = "En Ejecución"
    SOLUCIONADO = "Solucionado"


class TicketCreate(BaseModel):
    """
    Schema para crear un ticket.
    - El estado se asigna como 'Creado' automáticamente.
    - Las fechas las maneja PostgreSQL.
    - usuario_id se obtiene del usuario autenticado (o especificado por Admin/Soporte).
    """
    titulo: str
    descripcion: str
    ubicacion: str
    tipo_caso: str
    usuario_id: int | None = None
    asignado_a: int | None = None


class TicketUpdate(BaseModel):
    """
    Schema para actualizar un ticket (Soporte/Admin).
    Todos los campos son opcionales — se actualiza solo lo enviado.
    """
    titulo: str | None = None
    descripcion: str | None = None
    ubicacion: str | None = None
    tipo_caso: str | None = None
    estado: EstadoTicket | None = None
    asignado_a: int | None = None


class TicketResponse(BaseModel):
    """Schema de respuesta completo con relaciones anidadas."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    descripcion: str
    ubicacion: str
    tipo_caso: str
    estado: str
    usuario_id: int
    asignado_a: int | None = None
    fecha_creacion: datetime
    fecha_modificacion: datetime
    fecha_solucion: datetime | None = None

    # Relaciones anidadas
    usuario: UsuarioResponse
    asignado: UsuarioResponse | None = None


class TicketListResponse(BaseModel):
    """Schema de respuesta para listados (sin comentarios anidados)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    ubicacion: str
    tipo_caso: str
    estado: str
    fecha_creacion: datetime
    fecha_modificacion: datetime
    fecha_solucion: datetime | None = None

    usuario: UsuarioResponse
    asignado: UsuarioResponse | None = None
