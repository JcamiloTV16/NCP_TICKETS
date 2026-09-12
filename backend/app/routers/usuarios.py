"""
Router de usuarios.
Endpoints de gestión de usuarios (solo Administrador).
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import require_role
from app.dependencies.database import get_db
from app.schemas.usuario import UsuarioResponse, UsuarioUpdate
from app.services import usuario_service

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
    dependencies=[Depends(require_role("Administrador"))],
)


@router.get(
    "",
    response_model=list[UsuarioResponse],
    summary="Listar usuarios",
    description="Lista todos los usuarios del sistema. Solo Administrador.",
)
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    users = await usuario_service.list_users(db=db)
    return users


@router.patch(
    "/{user_id}",
    response_model=UsuarioResponse,
    summary="Actualizar usuario",
    description="Actualiza rol, cargo u otros datos de un usuario. Solo Administrador.",
)
async def update_user(
    user_id: int,
    data: UsuarioUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await usuario_service.update_user(db=db, user_id=user_id, data=data)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {user_id} no encontrado",
        )
    return user
