"""
Router de autenticación.
Endpoints para login con Google OAuth, dev-login y perfil del usuario autenticado.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import create_access_token
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import GoogleLoginRequest, TokenResponse, CompleteProfileRequest
from app.schemas.usuario import UsuarioResponse
from app.services.auth_service import login_with_google

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Login con Google OAuth",
    description="Recibe un Google ID Token, verifica con Google, "
    "crea/busca al usuario y retorna un JWT interno.",
)
async def google_login(
    body: GoogleLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    access_token = await login_with_google(
        google_token=body.google_token, db=db
    )
    return TokenResponse(access_token=access_token)



@router.get(
    "/me",
    response_model=UsuarioResponse,
    summary="Perfil del usuario autenticado",
    description="Retorna los datos del usuario autenticado a partir del JWT.",
)
async def get_me(
    current_user: Annotated[Usuario, Depends(get_current_user)],
):
    return current_user


@router.patch(
    "/complete-profile",
    response_model=UsuarioResponse,
    summary="Completar perfil de primer ingreso",
    description="Permite al usuario autenticado establecer su cargo y área "
    "la primera vez que ingresa al sistema.",
)
async def complete_profile(
    body: CompleteProfileRequest,
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Solo permitir si el perfil aún no ha sido completado
    if current_user.cargo != "Sin asignar" and current_user.area != "Sin asignar":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El perfil ya fue completado anteriormente.",
        )

    current_user.cargo = body.cargo.strip()
    current_user.area = body.area.strip()
    await db.flush()
    await db.refresh(current_user)
    return current_user
