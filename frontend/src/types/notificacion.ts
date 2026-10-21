export interface Notificacion {
  id: number;
  usuario_id: number;
  ticket_id: number | null;
  titulo: string;
  mensaje: string;
  tipo: 'nuevo_ticket' | 'cambio_estado' | 'nuevo_comentario' | string;
  leido: boolean;
  fecha_creacion: string;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface VapidPublicKeyResponse {
  public_key: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}
