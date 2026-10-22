"""
Router de notificaciones y Web Push.
Endpoints para suscripción a notificaciones push móviles, consulta de historial in-app y prueba.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.usuario import Usuario
from app.schemas.notificacion import (
    NotificacionResponse,
    PushSubscriptionCreate,
    PushSubscriptionResponse,
    TestNotificationRequest,
    VapidPublicKeyResponse,
)
from app.services import notification_service, push_service

router = APIRouter(prefix="/notifications", tags=["Notificaciones"])
settings = get_settings()


@router.get(
    "/vapid-public-key",
    response_model=VapidPublicKeyResponse,
    summary="Obtener clave pública VAPID",
    description="Retorna la clave pública para que el navegador/PWA del usuario se suscriba al servicio Push.",
)
async def get_vapid_public_key():
    try:
        public_key = push_service.get_vapid_public_key()
    except Exception:
        # Sin clave privada válida no se puede firmar; se devuelve la configurada como último recurso
        public_key = settings.VAPID_PUBLIC_KEY
    return VapidPublicKeyResponse(public_key=public_key)


@router.post(
    "/push/subscribe",
    response_model=PushSubscriptionResponse,
    status_code=201,
    summary="Suscribir dispositivo a Push Notifications",
    description="Registra la suscripción del navegador/celular del usuario autenticado.",
)
async def subscribe_push(
    data: PushSubscriptionCreate,
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    user_agent: Annotated[str | None, Header()] = None,
):
    sub = await push_service.save_or_update_subscription(
        db=db, usuario_id=current_user.id, data=data, user_agent=user_agent
    )
    return sub


@router.delete(
    "/push/unsubscribe",
    summary="Desuscribir dispositivo Push",
    description="Elimina el endpoint de suscripción de la base de datos.",
)
async def unsubscribe_push(
    endpoint: Annotated[str, Query(description="Endpoint a desuscribir")],
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    removed = await push_service.remove_subscription_by_endpoint(db=db, endpoint=endpoint)
    return {"status": "ok", "removed": removed}


@router.get(
    "",
    response_model=list[NotificacionResponse],
    summary="Listar notificaciones in-app",
    description="Lista las notificaciones recientes del usuario autenticado.",
)
async def list_notifications(
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
):
    return await notification_service.list_user_notifications(
        db=db, usuario_id=current_user.id, limit=limit
    )


@router.get(
    "/unread-count",
    summary="Conteo de no leídas",
    description="Obtiene el número de notificaciones no leídas para el badge.",
)
async def unread_count(
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    count = await notification_service.get_unread_count(db=db, usuario_id=current_user.id)
    return {"unread_count": count}


@router.patch(
    "/{notification_id}/read",
    summary="Marcar notificación como leída",
)
async def mark_read(
    notification_id: int,
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    success = await notification_service.mark_notification_as_read(
        db=db, notification_id=notification_id, usuario_id=current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada o no pertenece al usuario",
        )
    return {"status": "ok"}


@router.post(
    "/read-all",
    summary="Marcar todas las notificaciones como leídas",
)
async def mark_all_read(
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    updated = await notification_service.mark_all_as_read(
        db=db, usuario_id=current_user.id
    )
    return {"status": "ok", "marked_read": updated}


@router.post(
    "/test",
    summary="Enviar notificación push de prueba",
    description="Envía una notificación push de prueba al usuario actual para verificar la configuración en su celular/navegador.",
)
async def test_push_notification(
    data: TestNotificationRequest,
    current_user: Annotated[Usuario, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    count = await push_service.send_push_notification_to_user(
        db=db,
        usuario_id=current_user.id,
        title=data.title,
        body=data.body,
        url="/",
        tag="test-notification",
    )
    return {
        "status": "ok",
        "delivered_to_devices": count,
        "message": f"Se intentó enviar a los dispositivos registrados de {current_user.nombre}",
    }
