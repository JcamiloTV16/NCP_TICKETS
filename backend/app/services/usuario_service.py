"""
Servicio de usuarios.
CRUD y lógica de negocio para la entidad Usuario.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate


async def get_user_by_email(db: AsyncSession, email: str) -> Usuario | None:
    """Busca un usuario por email."""
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> Usuario | None:
    """Busca un usuario por ID."""
    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    return result.scalar_one_or_none()


async def get_or_create_user(
    db: AsyncSession, email: str, nombre: str
) -> Usuario:
    """
    Busca un usuario por email. Si no existe, lo crea con rol 'Usuario'.
    Usado tras autenticación OAuth exitosa.
    """
    user = await get_user_by_email(db, email)
    if user is not None:
        return user

    rol = "Usuario"
    email_lower = email.lower()
    if email_lower.startswith("sistemas@nuevo"):
        rol = "Administrador"
    elif email_lower.startswith("soporte@nuevo") or email_lower.startswith("tecnico@nuevo"):
        rol = "Soporte"

    new_user = Usuario(
        nombre=nombre,
        email=email,
        rol=rol,
        cargo="Sin asignar",
        area="Sin asignar",
    )
    db.add(new_user)
    await db.flush()  # Genera el ID sin hacer commit (el commit lo hace get_db)
    await db.refresh(new_user)
    return new_user


async def list_users(db: AsyncSession) -> list[Usuario]:
    """Lista todos los usuarios (para Admin)."""
    result = await db.execute(select(Usuario).order_by(Usuario.nombre))
    return list(result.scalars().all())


async def list_soporte_users(db: AsyncSession) -> list[Usuario]:
    """Lista usuarios con rol Soporte (para asignación automática)."""
    result = await db.execute(
        select(Usuario).where(Usuario.rol == "Soporte").order_by(Usuario.id)
    )
    return list(result.scalars().all())


async def update_user(
    db: AsyncSession, user_id: int, data: UsuarioUpdate
) -> Usuario | None:
    """Actualiza datos de un usuario. Retorna None si no existe."""
    user = await get_user_by_id(db, user_id)
    if user is None:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.flush()
    await db.refresh(user)
    return user
