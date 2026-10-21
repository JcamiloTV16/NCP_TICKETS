"""
Servicio central orquestador de notificaciones.
Unifica Notificaciones In-App (BD), Push Móviles (VAPID/PWA) y Correo Electrónico (SMTP).
"""

import logging
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comentario import Comentario
from app.models.notificacion import Notificacion
from app.models.ticket import Ticket
from app.models.usuario import Usuario
from app.services import email_service, push_service

logger = logging.getLogger("ncp_tickets.notifications")


async def notify_ticket_created(db: AsyncSession, ticket: Ticket) -> None:
    """
    Notifica al usuario de soporte asignado que se le ha asignado un nuevo caso.
    Canales: In-App, Push Móvil y Correo Electrónico.
    """
    if not ticket.asignado_a:
        logger.info(f"[NOTIFICACIÓN] Ticket #{ticket.id} no tiene soporte asignado aún.")
        return

    # Cargar usuario asignado y solicitante si no están en memoria
    support_user = ticket.asignado
    if support_user is None:
        res = await db.execute(select(Usuario).where(Usuario.id == ticket.asignado_a))
        support_user = res.scalar_one_or_none()

    requester_user = ticket.usuario
    if requester_user is None:
        res = await db.execute(select(Usuario).where(Usuario.id == ticket.usuario_id))
        requester_user = res.scalar_one_or_none()

    if not support_user or not requester_user:
        return

    titulo = f"🎫 Nuevo caso asignado: #{ticket.id}"
    mensaje = f"{ticket.titulo} ({ticket.tipo_caso}) en {ticket.ubicacion}. Solicitado por: {requester_user.nombre}."

    # 1. Registro In-App en base de datos
    notif = Notificacion(
        usuario_id=support_user.id,
        ticket_id=ticket.id,
        titulo=titulo,
        mensaje=mensaje,
        tipo="nuevo_ticket",
        leido=False,
    )
    db.add(notif)
    await db.flush()

    # 2. Notificación Push a dispositivos móviles y navegador
    await push_service.send_push_notification_to_user(
        db=db,
        usuario_id=support_user.id,
        title=titulo,
        body=f"{ticket.titulo} ({ticket.tipo_caso}) - {ticket.ubicacion}",
        url=f"/tickets/{ticket.id}",
        tag=f"ticket-{ticket.id}",
    )

    # 3. Correo electrónico al soporte asignado
    subject, html_body = email_service.build_ticket_assigned_email(
        ticket=ticket, support_user=support_user, requester_user=requester_user
    )
    await email_service.send_email(
        to_email=support_user.email,
        subject=subject,
        html_content=html_body,
    )


async def notify_ticket_status_changed(
    db: AsyncSession, ticket: Ticket, old_status: str, new_status: str
) -> None:
    """
    Notifica al creador del ticket que su caso ha cambiado de estado.
    Canales: In-App, Push Móvil y Correo Electrónico.
    """
    if old_status == new_status:
        return

    requester_user = ticket.usuario
    if requester_user is None:
        res = await db.execute(select(Usuario).where(Usuario.id == ticket.usuario_id))
        requester_user = res.scalar_one_or_none()

    if not requester_user:
        return

    titulo = f"🔄 Actualización en tu caso #{ticket.id}"
    mensaje = f"Tu ticket '{ticket.titulo}' ha cambiado de estado a: {new_status}."

    # 1. Registro In-App en base de datos
    notif = Notificacion(
        usuario_id=requester_user.id,
        ticket_id=ticket.id,
        titulo=titulo,
        mensaje=mensaje,
        tipo="cambio_estado",
        leido=False,
    )
    db.add(notif)
    await db.flush()

    # 2. Notificación Push a dispositivos móviles y navegador
    await push_service.send_push_notification_to_user(
        db=db,
        usuario_id=requester_user.id,
        title=titulo,
        body=f"El estado cambió de '{old_status}' a '{new_status}'.",
        url=f"/tickets/{ticket.id}",
        tag=f"ticket-status-{ticket.id}",
    )

    # 3. Correo electrónico al solicitante
    subject, html_body = email_service.build_ticket_status_email(
        ticket=ticket,
        requester_user=requester_user,
        old_status=old_status,
        new_status=new_status,
    )
    await email_service.send_email(
        to_email=requester_user.email,
        subject=subject,
        html_content=html_body,
    )


async def notify_comment_added(
    db: AsyncSession, ticket: Ticket, comment: Comentario, author_user: Usuario
) -> None:
    """
    Notifica a la contraparte cuando se agrega un nuevo comentario de seguimiento:
    - Si comenta el solicitante -> notifica al soporte asignado.
    - Si comenta soporte o admin -> notifica al solicitante.
    """
    # Determinar destinatario
    if author_user.id == ticket.usuario_id:
        recipient_id = ticket.asignado_a
    else:
        recipient_id = ticket.usuario_id

    if not recipient_id:
        return

    res = await db.execute(select(Usuario).where(Usuario.id == recipient_id))
    recipient = res.scalar_one_or_none()
    if not recipient or recipient.id == author_user.id:
        return

    titulo = f"💬 Nuevo mensaje en #{ticket.id}"
    snippet = comment.comentario[:120] + ("..." if len(comment.comentario) > 120 else "")
    mensaje = f"{author_user.nombre}: {snippet}"

    # 1. Registro In-App
    notif = Notificacion(
        usuario_id=recipient.id,
        ticket_id=ticket.id,
        titulo=titulo,
        mensaje=mensaje,
        tipo="nuevo_comentario",
        leido=False,
    )
    db.add(notif)
    await db.flush()

    # 2. Notificación Push móvil
    await push_service.send_push_notification_to_user(
        db=db,
        usuario_id=recipient.id,
        title=titulo,
        body=f"{author_user.nombre}: {comment.comentario[:90]}",
        url=f"/tickets/{ticket.id}",
        tag=f"ticket-comment-{ticket.id}",
    )

    # 3. Correo electrónico
    subject, html_body = email_service.build_comment_email(
        ticket=ticket,
        recipient_user=recipient,
        author_user=author_user,
        comment_text=comment.comentario,
    )
    await email_service.send_email(
        to_email=recipient.email,
        subject=subject,
        html_content=html_body,
    )


async def list_user_notifications(
    db: AsyncSession, usuario_id: int, limit: int = 30
) -> list[Notificacion]:
    """Lista las notificaciones in-app de un usuario ordenadas por fecha reciente."""
    result = await db.execute(
        select(Notificacion)
        .where(Notificacion.usuario_id == usuario_id)
        .order_by(Notificacion.fecha_creacion.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def mark_notification_as_read(
    db: AsyncSession, notification_id: int, usuario_id: int
) -> bool:
    """Marca una notificación como leída."""
    result = await db.execute(
        update(Notificacion)
        .where(
            Notificacion.id == notification_id,
            Notificacion.usuario_id == usuario_id,
        )
        .values(leido=True)
    )
    await db.flush()
    return result.rowcount > 0


async def mark_all_as_read(db: AsyncSession, usuario_id: int) -> int:
    """Marca todas las notificaciones pendientes de un usuario como leídas."""
    result = await db.execute(
        update(Notificacion)
        .where(
            Notificacion.usuario_id == usuario_id,
            Notificacion.leido == False,
        )
        .values(leido=True)
    )
    await db.flush()
    return result.rowcount


async def get_unread_count(db: AsyncSession, usuario_id: int) -> int:
    """Retorna el número de notificaciones no leídas."""
    result = await db.execute(
        select(func.count(Notificacion.id)).where(
            Notificacion.usuario_id == usuario_id,
            Notificacion.leido == False,
        )
    )
    return result.scalar() or 0
