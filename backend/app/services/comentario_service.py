"""
Servicio de comentarios.
Lógica de negocio para agregar y listar comentarios de un ticket.
"""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comentario import Comentario
from app.models.ticket import Ticket
from app.schemas.comentario import ComentarioCreate


async def add_comment(
    db: AsyncSession,
    ticket_id: int,
    usuario_id: int,
    data: ComentarioCreate,
) -> Comentario:
    """
    Agrega un comentario a un ticket existente.
    Lanza 404 si el ticket no existe.
    Nota: El trigger en PostgreSQL actualiza fecha_modificacion del ticket.
    """
    # Verificar que el ticket existe
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket con ID {ticket_id} no encontrado",
        )

    comentario = Comentario(
        ticket_id=ticket_id,
        usuario_id=usuario_id,
        comentario=data.comentario,
        # fecha_creacion → manejada por DEFAULT NOW() en PostgreSQL
    )
    db.add(comentario)
    await db.flush()
    await db.refresh(comentario)
    return comentario


async def list_comments_by_ticket(
    db: AsyncSession, ticket_id: int
) -> list[Comentario]:
    """Lista todos los comentarios de un ticket, ordenados cronológicamente."""
    result = await db.execute(
        select(Comentario)
        .where(Comentario.ticket_id == ticket_id)
        .order_by(Comentario.fecha_creacion.asc())
    )
    return list(result.scalars().all())
