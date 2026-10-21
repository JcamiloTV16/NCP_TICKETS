import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import type { Notificacion } from '../types/notificacion';
import { useAuth } from './useAuth';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function checkPushSupport(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const isSupported = checkPushSupport();
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Verificar si ya existe una suscripción activa en el navegador
  useEffect(() => {
    if (isSupported) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsPushSubscribed(!!sub);
        });
      });
    }
  }, [isSupported]);

  // Cargar notificaciones e in-app count
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [list, count] = await Promise.all([
        notificationService.listNotifications(20),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error('[NOTIFICACIONES] Error al consultar notificaciones:', err);
    }
  }, [user]);

  // Cargar al montar y con sondeo ligero cada 35 segundos
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 35000);

    const onFocus = () => {
      fetchNotifications();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchNotifications]);

  // Suscribirse a Push Notifications en el celular o navegador
  const subscribeToPush = async (): Promise<boolean> => {
    if (!isSupported) {
      alert('Tu navegador o dispositivo no soporta notificaciones Web Push.');
      return false;
    }

    try {
      setLoading(true);
      // Solicitar permiso al usuario
      const currentPerm = await Notification.requestPermission();
      setPermission(currentPerm);

      if (currentPerm !== 'granted') {
        alert('Se denegó el permiso para notificaciones. Puedes habilitarlo en los ajustes de tu navegador.');
        return false;
      }

      // Obtener registro de Service Worker
      const reg = await navigator.serviceWorker.ready;

      // Obtener clave pública VAPID del backend
      const vapidPublicKey = await notificationService.getVapidPublicKey();
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // Crear o recuperar suscripción en PushManager
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      const rawJson = sub.toJSON();
      if (!rawJson.endpoint || !rawJson.keys?.p256dh || !rawJson.keys?.auth) {
        throw new Error('Suscripción generada inválida');
      }

      // Registrar suscripción en el backend
      await notificationService.subscribePush({
        endpoint: rawJson.endpoint,
        keys: {
          p256dh: rawJson.keys.p256dh,
          auth: rawJson.keys.auth,
        },
      });

      setIsPushSubscribed(true);
      return true;
    } catch (err) {
      console.error('[PUSH] Error al suscribirse a notificaciones push:', err);
      alert('Hubo un error al suscribir este dispositivo a las notificaciones.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Marcar una como leída
  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leido: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NOTIFICACIONES] Error al marcar como leída:', err);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, leido: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NOTIFICACIONES] Error al marcar todas como leídas:', err);
    }
  };

  // Enviar notificación de prueba
  const sendTestNotification = async () => {
    try {
      await notificationService.sendTestNotification();
      // Refrescar notificaciones
      setTimeout(fetchNotifications, 1000);
    } catch (err) {
      console.error('[PUSH] Error al enviar prueba:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    permission,
    isPushSubscribed,
    isSupported,
    loading,
    subscribeToPush,
    markAsRead,
    markAllAsRead,
    sendTestNotification,
    refreshNotifications: fetchNotifications,
  };
}
