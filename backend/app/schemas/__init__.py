"""
Módulo de schemas Pydantic v2.
"""

from app.schemas.auth import GoogleLoginRequest, TokenResponse
from app.schemas.usuario import (
    RolUsuario,
    UsuarioCreate,
    UsuarioResponse,
    UsuarioUpdate,
)
from app.schemas.ticket import (
    EstadoTicket,
    TicketCreate,
    TicketListResponse,
    TicketResponse,
    TicketUpdate,
)
from app.schemas.comentario import (
    ComentarioCreate,
    ComentarioResponse,
)

__all__ = [
    "GoogleLoginRequest",
    "TokenResponse",
    "RolUsuario",
    "UsuarioCreate",
    "UsuarioResponse",
    "UsuarioUpdate",
    "EstadoTicket",
    "TicketCreate",
    "TicketListResponse",
    "TicketResponse",
    "TicketUpdate",
    "ComentarioCreate",
    "ComentarioResponse",
]
