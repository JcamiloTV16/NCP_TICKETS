"""
Servicio de Notificaciones Push Web (PWA / Celulares y Navegadores).
Gestiona el ciclo de vida de PushSubscription y el envío cifrado mediante pywebpush (VAPID RFC 8291/8292).
"""

import asyncio
import base64
import json
import logging
import re

from cryptography.hazmat.primitives import serialization
from py_vapid import Vapid
from pywebpush import WebPushException, webpush
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.notificacion import PushSubscription
from app.schemas.notificacion import PushSubscriptionCreate

logger = logging.getLogger("ncp_tickets.push")
settings = get_settings()

_vapid_instance: Vapid | None = None


def _get_vapid() -> Vapid:
    """
    Carga la clave privada VAPID una sola vez. Soporta:
    - Contenido PEM completo en VAPID_PRIVATE_KEY (con saltos reales o '\\n' escapados), p.ej. en Render.
    - Clave en base64url (raw/DER) en VAPID_PRIVATE_KEY.
    - Ruta a archivo .pem en VAPID_PRIVATE_KEY_PATH (desarrollo local).
    """
    global _vapid_instance
    if _vapid_instance is not None:
        return _vapid_instance

    raw = (settings.VAPID_PRIVATE_KEY or "").strip().strip('"').strip("'")
    if raw:
        if "BEGIN" in raw:
            # Normalizar PEM sin importar cómo se guardó (saltos reales, '\n' escapados o en una sola línea)
            pem = raw.replace("\\n", "\n")
            match = re.search(r"-----BEGIN ([A-Z ]+)-----(.*?)-----END \1-----", pem, re.DOTALL)
            if not match:
                raise ValueError("VAPID_PRIVATE_KEY parece PEM pero no tiene marcadores BEGIN/END válidos")
            label, body = match.group(1), re.sub(r"\s+", "", match.group(2))
            wrapped = "\n".join(body[i : i + 64] for i in range(0, len(body), 64))
            pem = f"-----BEGIN {label}-----\n{wrapped}\n-----END {label}-----\n"
            _vapid_instance = Vapid.from_pem(pem.encode())
        else:
            _vapid_instance = Vapid.from_string(private_key=raw)
        logger.info("[PUSH] Clave VAPID cargada desde la variable VAPID_PRIVATE_KEY")
    else:
        _vapid_instance = Vapid.from_file(settings.VAPID_PRIVATE_KEY_PATH)
        logger.info(f"[PUSH] Clave VAPID cargada desde archivo {settings.VAPID_PRIVATE_KEY_PATH}")

    derived = _derive_public_key(_vapid_instance)
    configured = (settings.VAPID_PUBLIC_KEY or "").strip().strip('"').strip("'")
    if configured and configured != derived:
        logger.warning(
            "[PUSH] VAPID_PUBLIC_KEY configurada NO corresponde a VAPID_PRIVATE_KEY. "
            f"Se usará la derivada de la privada: {derived}"
        )

    return _vapid_instance


def _derive_public_key(vapid: Vapid) -> str:
    """Clave pública (punto P-256 sin comprimir, base64url sin padding) derivada de la privada."""
    raw = vapid.public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint,
    )
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def get_vapid_public_key() -> str:
    """
    Fuente única de verdad para el applicationServerKey del navegador.
    Siempre se deriva de la clave privada cargada, evitando VapidPkHashMismatch.
    """
    return _derive_public_key(_get_vapid())


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

    try:
        vapid_key = _get_vapid()
    except Exception as exc:
        logger.error(f"[PUSH ERROR] No se pudo cargar la clave privada VAPID: {exc}", exc_info=True)
        return 0

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
                vapid_private_key=vapid_key,
                # dict nuevo por envío: pywebpush añade 'aud' y 'exp' según el endpoint (Apple/Google/Mozilla)
                vapid_claims={"sub": settings.VAPID_CLAIM_EMAIL},
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
            # HTTP 404 o 410 indican suscripción expirada o permiso revocado en el navegador.
            # 400 VapidPkHashMismatch (FCM) / 403 (Mozilla/Apple) indican que la suscripción
            # se creó con otra clave pública VAPID: nunca volverá a funcionar, se purga.
            response_code = getattr(getattr(exc, "response", None), "status_code", None)
            exc_text = str(exc)
            if (
                response_code in (403, 404, 410)
                or "410 Gone" in exc_text
                or "404 Not Found" in exc_text
                or "VapidPkHashMismatch" in exc_text
            ):
                logger.info(f"[PUSH] Marcando endpoint revocado para eliminación: {sub.endpoint[:40]}...")
                expired_endpoints.append(sub.endpoint)
        except Exception as exc:
            logger.error(f"[PUSH ERROR] Excepción inesperada en Sub ID {sub.id}: {exc}", exc_info=True)

    # Limpiar endpoints inválidos de la BD
    if expired_endpoints:
        for ep in expired_endpoints:
            await remove_subscription_by_endpoint(db, ep)

    return success_count
