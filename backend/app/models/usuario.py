"""
Modelo ORM para la tabla `usuarios`.
"""

from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    __table_args__ = (
        CheckConstraint(
            "rol IN ('Usuario', 'Soporte', 'Administrador')",
            name="ck_usuarios_rol",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    rol: Mapped[str] = mapped_column(String(50), nullable=False)
    cargo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    area: Mapped[str | None] = mapped_column(String(100), nullable=True)

    def __repr__(self) -> str:
        return f"<Usuario(id={self.id}, email='{self.email}', rol='{self.rol}')>"
