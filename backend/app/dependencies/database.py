"""
Dependencia de sesión de base de datos para inyección en routers.
Re-exporta get_db desde core/database.py.
"""

from app.core.database import get_db

__all__ = ["get_db"]
