"""
Router de tickets.
Endpoints para CRUD de tickets y dashboard (Soporte/Admin).
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user, require_role
from app.dependencies.database import get_db
from app.models.usuario import Usuario
from app.schemas.ticket import (
    TicketCreate,
    TicketListResponse,
    TicketResponse,
    TicketUpdate,
    TicketCalificacionCreate,
    SupportAnalyticsResponse,
)
from app.services import ticket_service

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.post(
    "",
    response_model=TicketResponse,
    status_code=201,
    summary="Crear ticket",
    description="Crea un nuevo ticket y lo asigna automáticamente a soporte.",
)
async def create_ticket(
    data: TicketCreate,
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    target_user_id = current_user.id
    if data.usuario_id and current_user.rol in ("Administrador", "Soporte"):
        target_user_id = data.usuario_id

    ticket = await ticket_service.create_ticket(
        db=db, data=data, usuario_id=target_user_id
    )
    return ticket


@router.get(
    "",
    response_model=list[TicketListResponse],
    summary="Listar mis tickets",
    description="Lista los tickets creados por el usuario autenticado.",
)
async def list_my_tickets(
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    tickets = await ticket_service.list_tickets_by_user(
        db=db, usuario_id=current_user.id
    )
    return tickets


@router.get(
    "/dashboard",
    response_model=list[TicketListResponse],
    summary="Dashboard de tickets",
    description="Lista todos los tickets del sistema. Solo para Soporte y Administrador.",
    dependencies=[Depends(require_role("Soporte", "Administrador"))],
)
async def dashboard_tickets(
    db: Annotated[AsyncSession, Depends(get_db)],
    estado: Annotated[str | None, Query(description="Filtrar por estado")] = None,
    tipo_caso: Annotated[str | None, Query(description="Filtrar por tipo de caso")] = None,
):
    tickets = await ticket_service.list_all_tickets(
        db=db, estado=estado, tipo_caso=tipo_caso
    )
    return tickets


@router.get(
    "/analytics/support",
    response_model=SupportAnalyticsResponse,
    summary="Analíticas de soporte",
    description="Calcula tiempos promedio de respuesta, solución y métricas de satisfacción.",
)
async def get_support_analytics(
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await ticket_service.get_support_analytics(db=db)


@router.post(
    "/{ticket_id}/calificar",
    response_model=TicketResponse,
    summary="Calificar atención del ticket",
    description="Registra la calificación de satisfacción (1-5 estrellas) y comentario del usuario.",
)
async def calificar_ticket(
    ticket_id: int,
    data: TicketCalificacionCreate,
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    ticket = await ticket_service.calificar_ticket(
        db=db, ticket_id=ticket_id, usuario_id=current_user.id, data=data
    )
    return ticket


@router.get(
    "/{ticket_id}",
    response_model=TicketResponse,
    summary="Detalle de ticket",
    description="Obtiene el detalle completo de un ticket por su ID.",
)
async def get_ticket(
    ticket_id: int,
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    ticket = await ticket_service.get_ticket_by_id(db=db, ticket_id=ticket_id)
    if ticket is None:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket con ID {ticket_id} no encontrado",
        )

    # Usuarios normales solo ven sus propios tickets
    if (
        current_user.rol == "Usuario"
        and ticket.usuario_id != current_user.id
    ):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este ticket",
        )

    return ticket


@router.patch(
    "/{ticket_id}",
    response_model=TicketResponse,
    summary="Actualizar ticket",
    description="Actualiza estado, asignación u otros campos. Solo Soporte y Administrador.",
    dependencies=[Depends(require_role("Soporte", "Administrador"))],
)
async def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    ticket = await ticket_service.update_ticket(
        db=db, ticket_id=ticket_id, data=data
    )
    return ticket
