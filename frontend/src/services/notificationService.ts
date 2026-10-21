import { api } from './api';
import type {
  Notificacion,
  PushSubscriptionPayload,
  UnreadCountResponse,
  VapidPublicKeyResponse,
} from '../types/notificacion';

export const notificationService = {
  /**
   * Obtiene la clave pública VAPID para suscripción Web Push en el navegador.
   */
  async getVapidPublicKey(): Promise<string> {
    const { data } = await api.get<VapidPublicKeyResponse>('/notifications/vapid-public-key');
    return data.public_key;
  },

  /**
   * Registra una suscripción Push en el backend asociada al usuario actual.
   */
  async subscribePush(subscription: PushSubscriptionPayload): Promise<void> {
    await api.post('/notifications/push/subscribe', subscription);
  },

  /**
   * Elimina una suscripción Push por su endpoint.
   */
  async unsubscribePush(endpoint: string): Promise<void> {
    await api.delete('/notifications/push/unsubscribe', {
      params: { endpoint },
    });
  },

  /**
   * Lista las notificaciones in-app recientes del usuario.
   */
  async listNotifications(limit: number = 30): Promise<Notificacion[]> {
    const { data } = await api.get<Notificacion[]>('/notifications', {
      params: { limit },
    });
    return data;
  },

  /**
   * Obtiene el conteo de notificaciones no leídas para el badge.
   */
  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return data.unread_count;
  },

  /**
   * Marca una notificación específica como leída.
   */
  async markAsRead(notificationId: number): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  /**
   * Marca todas las notificaciones pendientes como leídas.
   */
  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },

  /**
   * Envía una notificación push de prueba al dispositivo actual del usuario.
   */
  async sendTestNotification(title?: string, body?: string): Promise<void> {
    await api.post('/notifications/test', {
      title: title || 'Prueba de NCP Tickets',
      body: body || '¡Notificación en tu dispositivo configurada correctamente!',
    });
  },
};
