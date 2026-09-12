"""
Servicio de tickets.
Lógica de negocio para creación, consulta, actualización y dashboard.
"""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ticket import Ticket
from app.models.usuario import Usuario
from app.schemas.ticket import TicketCreate, TicketUpdate
from app.services.usuario_service import list_soporte_users


async def create_ticket(
    db: AsyncSession, data: TicketCreate, usuario_id: int
) -> Ticket:
    """
    Crea un ticket y lo asigna automáticamente al miembro de soporte
    con menos tickets activos (balanceo de carga simple), o al asignado especificado.
    """
    asignado_id = getattr(data, "asignado_a", None)
    if asignado_id is None:
        asignado_id = await _auto_assign_soporte(db)

    ticket = Ticket(
        titulo=data.titulo,
        descripcion=data.descripcion,
        ubicacion=data.ubicacion,
        tipo_caso=data.tipo_caso,
        usuario_id=usuario_id,
        asignado_a=asignado_id,
        # estado, fecha_creacion, fecha_modificacion → manejados por PostgreSQL
    )
    db.add(ticket)
    await db.flush()
    await db.refresh(ticket)
    return ticket


async def get_ticket_by_id(db: AsyncSession, ticket_id: int) -> Ticket | None:
    """Obtiene un ticket por ID con relaciones cargadas (selectin)."""
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    return result.scalar_one_or_none()


async def list_tickets_by_user(db: AsyncSession, usuario_id: int) -> list[Ticket]:
    """Lista los tickets creados por un usuario específico."""
    result = await db.execute(
        select(Ticket)
        .where(Ticket.usuario_id == usuario_id)
        .order_by(Ticket.fecha_creacion.desc())
    )
    return list(result.scalars().all())


async def list_all_tickets(
    db: AsyncSession,
    estado: str | None = None,
    tipo_caso: str | None = None,
) -> list[Ticket]:
    """
    Lista todos los tickets (dashboard de Soporte/Admin).
    Filtros opcionales por estado y tipo_caso.
    """
    query = select(Ticket)

    if estado:
        query = query.where(Ticket.estado == estado)
    if tipo_caso:
        query = query.where(Ticket.tipo_caso == tipo_caso)

    query = query.order_by(Ticket.fecha_creacion.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_ticket(
    db: AsyncSession, ticket_id: int, data: TicketUpdate
) -> Ticket:
    """
    Actualiza un ticket (estado, asignado, etc.).
    Si el estado cambia a 'Solucionado', registra fecha_solucion.
    """
    ticket = await get_ticket_by_id(db, ticket_id)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket con ID {ticket_id} no encontrado",
        )

    update_data = data.model_dump(exclude_unset=True)

    # Si cambia a 'Solucionado', registrar fecha_solucion
    new_estado = update_data.get("estado")
    if new_estado == "Solucionado" and ticket.estado != "Solucionado":
        update_data["fecha_solucion"] = datetime.now(timezone.utc)

    # Aplicar cambios
    for field, value in update_data.items():
        setattr(ticket, field, value)

    await db.flush()
    await db.refresh(ticket)
    return ticket


async def _auto_assign_soporte(db: AsyncSession) -> int | None:
    """
    Asigna automáticamente al miembro de Soporte con menos tickets activos.
    Retorna el ID del usuario de soporte, o None si no hay ninguno.
    """
    soporte_users = await list_soporte_users(db)
    if not soporte_users:
        return None

    # Contar tickets activos (no solucionados) por cada soporte
    min_count = float("inf")
    best_user_id = soporte_users[0].id

    for user in soporte_users:
        result = await db.execute(
            select(func.count(Ticket.id)).where(
                Ticket.asignado_a == user.id,
                Ticket.estado != "Solucionado",
            )
        )
        count = result.scalar() or 0
        if count < min_count:
            min_count = count
            best_user_id = user.id

    return best_user_id
