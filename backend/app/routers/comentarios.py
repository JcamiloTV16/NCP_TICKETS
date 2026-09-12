"""
Router de comentarios.
Endpoints para agregar y listar comentarios de un ticket.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.usuario import Usuario
from app.schemas.comentario import ComentarioCreate, ComentarioResponse
from app.services import comentario_service

router = APIRouter(prefix="/tickets/{ticket_id}/comentarios", tags=["Comentarios"])


@router.post(
    "",
    response_model=ComentarioResponse,
    status_code=201,
    summary="Agregar comentario",
    description="Agrega un comentario de seguimiento a un ticket existente.",
)
async def add_comment(
    ticket_id: int,
    data: ComentarioCreate,
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    comentario = await comentario_service.add_comment(
        db=db,
        ticket_id=ticket_id,
        usuario_id=current_user.id,
        data=data,
    )
    return comentario


@router.get(
    "",
    response_model=list[ComentarioResponse],
    summary="Listar comentarios",
    description="Lista todos los comentarios de un ticket, ordenados cronológicamente.",
)
async def list_comments(
    ticket_id: int,
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    comments = await comentario_service.list_comments_by_ticket(
        db=db, ticket_id=ticket_id
    )
    return comments
