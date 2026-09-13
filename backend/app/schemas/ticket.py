"""
Schemas Pydantic v2 para la entidad Ticket.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

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


class TicketCalificacionCreate(BaseModel):
    """Schema para registrar la evaluación de satisfacción (1 a 5 estrellas)."""
    calificacion: int = Field(..., ge=1, le=5, description="Puntuación de 1 a 5 estrellas")
    comentario: str | None = Field(None, max_length=1000, description="Comentario opcional del usuario")


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
    fecha_primera_respuesta: datetime | None = None
    fecha_solucion: datetime | None = None

    # Calificación de satisfacción
    calificacion: int | None = None
    comentario_calificacion: str | None = None
    fecha_calificacion: datetime | None = None

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
    fecha_primera_respuesta: datetime | None = None
    fecha_solucion: datetime | None = None

    calificacion: int | None = None

    usuario: UsuarioResponse
    asignado: UsuarioResponse | None = None


class CategoriaTiempo(BaseModel):
    """Métricas de tiempo por tipo de caso."""
    tipo_caso: str
    promedio_solucion_minutos: float
    promedio_respuesta_minutos: float
    total_tickets: int


class TestimonioSatisfaccion(BaseModel):
    """Resumen de evaluación de satisfacción de un usuario."""
    ticket_id: int
    titulo_ticket: str
    usuario_nombre: str
    calificacion: int
    comentario: str | None = None
    fecha: datetime


class SupportAnalyticsResponse(BaseModel):
    """Métricas avanzadas para el dashboard de soporte y administración."""
    tiempo_promedio_primera_respuesta_minutos: float
    tiempo_promedio_solucion_minutos: float
    tiempos_por_categoria: list[CategoriaTiempo]

    # Métricas de encuesta de satisfacción
    promedio_satisfaccion: float
    total_encuestas: int
    distribucion_estrellas: dict[str, int]
    porcentaje_satisfaccion: float
    ultimos_testimonios: list[TestimonioSatisfaccion]
