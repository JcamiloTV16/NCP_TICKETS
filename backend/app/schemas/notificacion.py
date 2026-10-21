"""
Schemas Pydantic para notificaciones del sistema y suscripciones Push Web.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys


class PushSubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    endpoint: str
    user_agent: str | None = None
    fecha_creacion: datetime


class VapidPublicKeyResponse(BaseModel):
    public_key: str


class NotificacionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    ticket_id: int | None = None
    titulo: str
    mensaje: str
    tipo: str
    leido: bool
    fecha_creacion: datetime


class TestNotificationRequest(BaseModel):
    title: str = "Notificación de Prueba"
    body: str = "Las notificaciones en tu dispositivo están funcionando correctamente."
