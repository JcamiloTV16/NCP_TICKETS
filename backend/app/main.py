"""
Punto de entrada de la aplicación FastAPI.
Registra routers, middleware CORS y health check.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import auth, comentarios, tickets, usuarios

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la app: startup y shutdown."""
    # Startup: se podría verificar conexión a BD aquí
    yield
    # Shutdown: cerrar el engine pool
    from app.core.database import engine
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API Backend del Sistema de Gestión de Tickets de Soporte "
        "para Inversiones Oeding. "
        "Autenticación vía Google Workspace OAuth 2.0."
    ),
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

API_V1_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(tickets.router, prefix=API_V1_PREFIX)
app.include_router(comentarios.router, prefix=API_V1_PREFIX)
app.include_router(usuarios.router, prefix=API_V1_PREFIX)


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    """Endpoint de verificación de salud del servicio."""
    return {"status": "ok", "service": settings.APP_NAME}
