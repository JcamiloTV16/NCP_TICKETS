import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_3vxbdBku4tzD@ep-blue-rice-aehatw3i-pooler.c-2.us-east-2.aws.neon.tech/neondb"

async def clean_database():
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={"ssl": "require"},
    )
    async with engine.begin() as conn:
        print("Ejecutando TRUNCATE en comentarios, tickets, usuarios...")
        await conn.execute(text("TRUNCATE TABLE comentarios, tickets, usuarios RESTART IDENTITY CASCADE;"))
        print("Tablas limpiadas exitosamente.")

        # Verificar conteo
        u_count = await conn.scalar(text("SELECT count(*) FROM usuarios;"))
        t_count = await conn.scalar(text("SELECT count(*) FROM tickets;"))
        c_count = await conn.scalar(text("SELECT count(*) FROM comentarios;"))
        print(f"Estado actual de la BD: usuarios={u_count}, tickets={t_count}, comentarios={c_count}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(clean_database())
