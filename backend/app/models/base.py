"""
Clase base declarativa para todos los modelos SQLAlchemy 2.0.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Clase base de la que heredan todos los modelos ORM.
    SQLAlchemy 2.0 usa DeclarativeBase en lugar del legacy declarative_base().
    """
    pass
