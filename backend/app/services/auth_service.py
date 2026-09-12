"""
Servicio de autenticación.
Orquesta: verificación Google Token → buscar/crear usuario → emitir JWT.
"""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, verify_google_token
from app.services.usuario_service import get_or_create_user


async def login_with_google(google_token: str, db: AsyncSession) -> str:
    """
    Flujo completo de login con Google:
    1. Verifica el token de Google contra su API.
    2. Busca o crea al usuario en la BD.
    3. Genera y retorna un JWT interno.
    """
    # 1. Verificar token de Google
    google_payload = await verify_google_token(google_token)
    if google_payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de Google inválido o expirado",
        )

    email = google_payload.get("email")
    nombre = google_payload.get("name", email)

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo obtener el email del token de Google",
        )

    # Validar que sea del dominio de la institución
    if not email.lower().endswith("@nuevocolegiodelprado.edu.co"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El correo debe pertenecer a la institución @nuevocolegiodelprado.edu.co",
        )

    # 2. Buscar o crear usuario
    user = await get_or_create_user(db=db, email=email, nombre=nombre)

    # 3. Generar JWT interno
    access_token = create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "rol": user.rol,
        }
    )

    return access_token
