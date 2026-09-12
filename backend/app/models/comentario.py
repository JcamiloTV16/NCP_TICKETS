"""
Modelo ORM para la tabla `comentarios`.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.ticket import Ticket
    from app.models.usuario import Usuario


class Comentario(Base):
    __tablename__ = "comentarios"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False
    )
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False
    )
    comentario: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # ─── Relationships ────────────────────────────────────────────────────────

    ticket: Mapped["Ticket"] = relationship(
        "Ticket",
        back_populates="comentarios",
    )
    usuario: Mapped["Usuario"] = relationship(
        "Usuario",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Comentario(id={self.id}, ticket_id={self.ticket_id})>"
