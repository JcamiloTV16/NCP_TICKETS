"""
Configuración de la conexión async a PostgreSQL (Neon DB) con SQLAlchemy 2.0.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

settings = get_settings()

# Motor async optimizado para Neon DB (serverless)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Reconecta si Neon cerró la conexión por inactividad
    pool_recycle=300,     # Recicla conexiones cada 5 min (evita timeouts serverless)
)

# Factory de sesiones async
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Evita lazy-loads accidentales post-commit
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency de FastAPI: genera una sesión async por request.
    Se usa con `Depends(get_db)` en los routers.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
