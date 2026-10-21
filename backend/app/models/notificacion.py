"""
Modelos ORM para notificaciones del sistema y suscripciones Push Web.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.ticket import Ticket
    from app.models.usuario import Usuario


class PushSubscription(Base):
    """
    Almacena las suscripciones de navegadores / dispositivos móviles (PWA)
    para envío de notificaciones Web Push cifradas con VAPID.
    """
    __tablename__ = "push_subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    endpoint: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    p256dh: Mapped[str] = mapped_column(String(255), nullable=False)
    auth: Mapped[str] = mapped_column(String(255), nullable=False)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relación
    usuario: Mapped["Usuario"] = relationship("Usuario", lazy="selectin")

    def __repr__(self) -> str:
        return f"<PushSubscription(id={self.id}, usuario_id={self.usuario_id})>"


class Notificacion(Base):
    """
    Almacena notificaciones in-app (bandeja de notificaciones) para usuarios.
    """
    __tablename__ = "notificaciones"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ticket_id: Mapped[int | None] = mapped_column(
        ForeignKey("tickets.id", ondelete="CASCADE"), nullable=True, index=True
    )
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    mensaje: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)  # 'nuevo_ticket', 'cambio_estado', 'nuevo_comentario'
    leido: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relaciones
    usuario: Mapped["Usuario"] = relationship("Usuario", lazy="selectin")
    ticket: Mapped["Ticket | None"] = relationship("Ticket", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Notificacion(id={self.id}, usuario_id={self.usuario_id}, tipo='{self.tipo}', leido={self.leido})>"
