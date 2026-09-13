"""
Modelo ORM para la tabla `tickets`.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.comentario import Comentario
    from app.models.usuario import Usuario


class Ticket(Base):
    __tablename__ = "tickets"

    __table_args__ = (
        CheckConstraint(
            "estado IN ('Creado', 'En Ejecución', 'Solucionado')",
            name="ck_tickets_estado",
        ),
        CheckConstraint(
            "calificacion IS NULL OR (calificacion >= 1 AND calificacion <= 5)",
            name="ck_tickets_calificacion",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    ubicacion: Mapped[str] = mapped_column(String(150), nullable=False)
    tipo_caso: Mapped[str] = mapped_column(String(100), nullable=False)
    estado: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default="Creado"
    )

    # Foreign Keys
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False
    )
    asignado_a: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )

    # Fechas — TIMESTAMP WITH TIME ZONE manejadas por DEFAULT y Triggers en PostgreSQL
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    fecha_modificacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    fecha_primera_respuesta: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    fecha_solucion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Encuesta de satisfacción (1 a 5 estrellas)
    calificacion: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    comentario_calificacion: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    fecha_calificacion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ─── Relationships ────────────────────────────────────────────────────────

    usuario: Mapped["Usuario"] = relationship(
        "Usuario",
        foreign_keys=[usuario_id],
        lazy="selectin",
    )
    asignado: Mapped["Usuario | None"] = relationship(
        "Usuario",
        foreign_keys=[asignado_a],
        lazy="selectin",
    )
    comentarios: Mapped[list["Comentario"]] = relationship(
        "Comentario",
        back_populates="ticket",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Ticket(id={self.id}, estado='{self.estado}', titulo='{self.titulo[:30]}')>"
