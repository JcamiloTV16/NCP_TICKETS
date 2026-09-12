import asyncio
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL no encontrada en el archivo .env")
    sys.exit(1)

async def test_conn():
    print(f"Probando conexión a Neon DB...")
    try:
        engine = create_async_engine(
            DATABASE_URL,
            connect_args={"ssl": "require"},
        )
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version();"))
            version = result.scalar()
            print("¡CONEXION EXITOSA!")
            print(f"PostgreSQL Version: {version}")

            # Verificar tablas existentes
            tables_res = await conn.execute(text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
            ))
            tables = [row[0] for row in tables_res.fetchall()]
            print(f"Tablas en 'public': {tables}")

        await engine.dispose()
    except Exception as e:
        print(f"ERROR conectando a BD: {type(e).__name__}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_conn())
