"""
Módulo de modelos SQLAlchemy.
Exporta todos los modelos para que Alembic y la app los reconozcan fácilmente.
"""

from app.models.base import Base
from app.models.usuario import Usuario
from app.models.ticket import Ticket
from app.models.comentario import Comentario

__all__ = ["Base", "Usuario", "Ticket", "Comentario"]
