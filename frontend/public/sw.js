// Service Worker para NCP Tickets (PWA & Web Push Notifications)

self.addEventListener('install', (event) => {
  // Activar inmediatamente el nuevo Service Worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Receptor de notificaciones Push enviadas desde el backend
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: 'NCP Tickets',
      body: event.data.text(),
      url: '/',
    };
  }

  const title = payload.title || 'NCP Tickets - Inversiones Oeding';
  const options = {
    body: payload.body || 'Tienes una nueva actualización en tu ticket.',
    icon: payload.icon || '/ncp-isotipo.svg',
    badge: payload.badge || '/ncp-isotipo.svg',
    tag: payload.tag || 'ncp-ticket-notification',
    renotify: true,
    data: {
      url: payload.url || '/',
      dateOfArrival: Date.now(),
    },
    vibrate: [150, 80, 150],
    actions: [
      {
        action: 'open',
        title: 'Ver Ticket',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Acción al hacer clic en la notificación en el celular o navegador
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una pestaña o ventana abierta de la app, enfocarla y navegar
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
