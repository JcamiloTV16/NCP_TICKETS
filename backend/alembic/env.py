"""
Alembic env.py configurado para migraciones async con SQLAlchemy 2.0.
Lee la URL de la BD desde la configuración de la app (Settings/.env).
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy import pool

from app.core.config import get_settings

# Importar TODOS los modelos para que Alembic detecte las tablas
from app.models.base import Base
from app.models.usuario import Usuario  # noqa: F401
from app.models.ticket import Ticket  # noqa: F401
from app.models.comentario import Comentario  # noqa: F401

# ─── Alembic Config ───────────────────────────────────────────────────────────

config = context.config
settings = get_settings()

# Inyectar la URL de la BD desde nuestro Settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Configurar logging desde alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata de los modelos — Alembic la usa para autogenerate
target_metadata = Base.metadata


# ─── Offline migrations (genera SQL sin conectar) ────────────────────────────

def run_migrations_offline() -> None:
    """Genera SQL de migración sin conectarse a la BD."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# ─── Online migrations (async) ───────────────────────────────────────────────

def do_run_migrations(connection):
    """Ejecuta migraciones con una conexión activa."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Crea un engine async y ejecuta las migraciones."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point para migraciones online (async)."""
    asyncio.run(run_async_migrations())


# ─── Dispatch ─────────────────────────────────────────────────────────────────

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
