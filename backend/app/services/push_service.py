"""
Servicio de Notificaciones Push Web (PWA / Celulares y Navegadores).
Gestiona el ciclo de vida de PushSubscription y el envío cifrado mediante pywebpush (VAPID RFC 8291/8292).
"""

import asyncio
import json
import logging

from pywebpush import WebPushException, webpush
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.notificacion import PushSubscription
from app.schemas.notificacion import PushSubscriptionCreate

logger = logging.getLogger("ncp_tickets.push")
settings = get_settings()


async def save_or_update_subscription(
    db: AsyncSession, usuario_id: int, data: PushSubscriptionCreate, user_agent: str | None = None
) -> PushSubscription:
    """
    Registra o actualiza la suscripción push para un dispositivo/navegador del usuario.
    """
    # Verificar si ya existe el endpoint
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.endpoint == data.endpoint)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.usuario_id = usuario_id
        existing.p256dh = data.keys.p256dh
        existing.auth = data.keys.auth
        if user_agent:
            existing.user_agent = user_agent[:255]
        sub = existing
    else:
        sub = PushSubscription(
            usuario_id=usuario_id,
            endpoint=data.endpoint,
            p256dh=data.keys.p256dh,
            auth=data.keys.auth,
            user_agent=user_agent[:255] if user_agent else None,
        )
        db.add(sub)

    await db.flush()
    await db.refresh(sub)
    logger.info(f"[PUSH] Suscripción registrada para usuario ID {usuario_id} (ID Sub: {sub.id})")
    return sub


async def remove_subscription_by_endpoint(db: AsyncSession, endpoint: str) -> bool:
    """Elimina una suscripción cuando el usuario la cancela."""
    result = await db.execute(
        delete(PushSubscription).where(PushSubscription.endpoint == endpoint)
    )
    await db.flush()
    return result.rowcount > 0


async def send_push_notification_to_user(
    db: AsyncSession,
    usuario_id: int,
    title: str,
    body: str,
    url: str = "/",
    tag: str | None = None,
) -> int:
    """
    Envía una notificación push a todos los dispositivos registrados del usuario.
    Limpia automáticamente los endpoints caducados o revocados (HTTP 410 o 404).
    Retorna el conteo de notificaciones entregadas con éxito.
    """
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.usuario_id == usuario_id)
    )
    subscriptions = list(result.scalars().all())

    if not subscriptions:
        logger.debug(f"[PUSH] Usuario {usuario_id} no tiene dispositivos suscritos.")
        return 0

    payload = json.dumps(
        {
            "title": title,
            "body": body,
            "url": url,
            "tag": tag or "ncp-ticket-notification",
            "icon": "/ncp-isotipo.svg",
            "badge": "/ncp-isotipo.svg",
        }
    )

    claims = {"sub": settings.VAPID_CLAIM_EMAIL}
    key_path = settings.VAPID_PRIVATE_KEY.strip() if settings.VAPID_PRIVATE_KEY else settings.VAPID_PRIVATE_KEY_PATH

    success_count = 0
    expired_endpoints: list[str] = []

    for sub in subscriptions:
        sub_info = {
            "endpoint": sub.endpoint,
            "keys": {
                "p256dh": sub.p256dh,
                "auth": sub.auth,
            },
        }

        try:
            # webpush de pywebpush es sincrónico (hace request HTTP sse/post), lo ejecutamos en un threadpool
            response = await asyncio.to_thread(
                webpush,
                subscription_info=sub_info,
                data=payload,
                vapid_private_key=key_path,
                vapid_claims=claims,
                ttl=3600 * 24,  # Guardar hasta 24h si el dispositivo está apagado
            )
            logger.info(
                f"[PUSH ENVIADO] Usuario {usuario_id} | Sub ID {sub.id} | Status {getattr(response, 'status_code', 200)}"
            )
            success_count += 1
        except WebPushException as exc:
            logger.warning(
                f"[PUSH FALLÓ] Error enviando a Sub ID {sub.id} (Usuario {usuario_id}): {exc}"
            )
            # HTTP 404 o 410 indican suscripción expirada o permiso revocado en el navegador
            response_code = getattr(getattr(exc, "response", None), "status_code", None)
            if response_code in (404, 410) or "410 Gone" in str(exc) or "404 Not Found" in str(exc):
                logger.info(f"[PUSH] Marcando endpoint revocado para eliminación: {sub.endpoint[:40]}...")
                expired_endpoints.append(sub.endpoint)
        except Exception as exc:
            logger.error(f"[PUSH ERROR] Excepción inesperada en Sub ID {sub.id}: {exc}", exc_info=True)

    # Limpiar endpoints inválidos de la BD
    if expired_endpoints:
        for ep in expired_endpoints:
            await remove_subscription_by_endpoint(db, ep)

    return success_count
