"""
Dependencias de autenticación y autorización.
Se usan con Depends() en los routers para proteger endpoints.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.dependencies.database import get_db
from app.models.usuario import Usuario

# Esquema de seguridad: espera header "Authorization: Bearer <token>"
security_scheme = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Usuario:
    """
    Decodifica el JWT del header Authorization, busca al usuario en BD.
    Lanza 401 si el token es inválido o el usuario no existe.
    """
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email: str | None = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sin subject (email)",
        )

    result = await db.execute(select(Usuario).where(Usuario.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    return user


def require_role(*allowed_roles: str):
    """
    Factory de dependencias para control de acceso por rol.

    Uso:
        @router.get("/admin", dependencies=[Depends(require_role("Administrador"))])
        async def admin_only(): ...

        @router.get("/staff", dependencies=[Depends(require_role("Soporte", "Administrador"))])
        async def staff_only(): ...
    """

    async def role_checker(
        current_user: Annotated[Usuario, Depends(get_current_user)],
    ) -> Usuario:
        if current_user.rol not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere rol: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker
