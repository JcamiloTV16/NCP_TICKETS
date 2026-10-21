import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Smartphone,
  Ticket,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ExternalLink,
  X,
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { Notificacion } from '../types/notificacion';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export const NotificationBell: React.FC<{ align?: 'right' | 'left' }> = ({ align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
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
  } = useNotifications();

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (item: Notificacion) => {
    if (!item.leido) {
      markAsRead(item.id);
    }
    setIsOpen(false);
    if (item.ticket_id) {
      navigate(`/tickets/${item.ticket_id}`);
    }
  };

  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case 'nuevo_ticket':
        return <Ticket className="h-4 w-4 text-blue-400" />;
      case 'cambio_estado':
        return <RefreshCw className="h-4 w-4 text-amber-400" />;
      case 'nuevo_comentario':
        return <MessageSquare className="h-4 w-4 text-cyan-400" />;
      default:
        return <Bell className="h-4 w-4 text-indigo-400" />;
    }
  };

  const showPushPrompt = isSupported && (!isPushSubscribed || permission !== 'granted');

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Botón Campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
          isOpen
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
        }`}
        title="Notificaciones"
        aria-label="Abrir notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-1 text-[10px] font-bold text-white shadow-md shadow-blue-500/30 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Panel de Notificaciones */}
      {isOpen && (
        <div
          className={`fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:top-full sm:mt-2.5 w-auto sm:w-[390px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[520px] transition-all animate-in fade-in-0 zoom-in-95 duration-150 ${
            align === 'left' ? 'sm:left-0 sm:right-auto' : 'sm:right-0 sm:left-auto'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 text-sm">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-blue-400 px-2 py-1 rounded-lg hover:bg-slate-800 transition"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Leer todas</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg sm:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Banner de suscripción a Notificaciones Push en Celular / PWA */}
          {showPushPrompt && (
            <div className="m-3 p-3 rounded-xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/50 border border-blue-500/30 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <span>Notificaciones en tu celular</span>
                  <Sparkles className="h-3 w-3 text-amber-400" />
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Recibe alertas instantáneas en tu dispositivo cuando asignen o actualicen un caso.
                </p>
                <button
                  onClick={subscribeToPush}
                  disabled={loading}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Activando...' : 'Activar en este dispositivo'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de Notificaciones */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 overscroll-contain">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-slate-500 mb-3">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-slate-300">No tienes notificaciones</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                  Aquí te avisaremos cuando haya actualizaciones en tus casos de soporte.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 hover:bg-slate-800/50 transition cursor-pointer flex items-start gap-3 relative ${
                    !item.leido ? 'bg-blue-950/20' : ''
                  }`}
                >
                  {/* Icono temático */}
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      !item.leido
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'bg-slate-800/70 border border-slate-700/40'
                    }`}
                  >
                    {getIconForType(item.tipo)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs truncate ${
                          !item.leido ? 'font-semibold text-slate-100' : 'font-medium text-slate-300'
                        }`}
                      >
                        {item.titulo}
                      </p>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                        {formatRelativeTime(item.fecha_creacion)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.mensaje}
                    </p>
                  </div>

                  {/* Indicador de no leído */}
                  {!item.leido && (
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">
              {isPushSubscribed ? '🔔 Push Móvil activo' : '🔕 Push desactivado'}
            </span>
            <button
              onClick={sendTestNotification}
              className="text-[11px] font-medium text-slate-400 hover:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Enviar prueba</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
