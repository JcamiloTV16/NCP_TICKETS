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

async def check_users():
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={"ssl": "require"},
    )
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, nombre, email, rol, cargo, area FROM usuarios;"))
        users = res.fetchall()
        print(f"Usuarios encontrados ({len(users)}):")
        for u in users:
            print(f"- ID: {u[0]} | Nombre: {u[1]} | Email: {u[2]} | Rol: {u[3]} | Cargo: {u[4]} | Area: {u[5]}")

        tickets_res = await conn.execute(text("SELECT count(*) FROM tickets;"))
        print(f"Total tickets en BD: {tickets_res.scalar()}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_users())
