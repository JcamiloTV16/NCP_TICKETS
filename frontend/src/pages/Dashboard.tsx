import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ticketService } from '../services';
import type { TicketListItem, DashboardMetrics, SupportAnalytics } from '../types';
import {
  Ticket,
  ClipboardList,
  Loader2 as LoaderCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  MapPin,
  User,
  Plus,
  Star,
  Zap,
  ThumbsUp,
} from 'lucide-react';
import { CreateTicketModal } from '../components/CreateTicketModal';

const estadoBadge: Record<string, { bg: string; text: string; dot: string }> = {
  Creado: { bg: 'bg-rose-500/10 border-rose-500/25', text: 'text-rose-400', dot: 'bg-rose-400' },
  'En Ejecución': { bg: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-400', dot: 'bg-amber-400' },
  Solucionado: { bg: 'bg-emerald-500/10 border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-400' },
};

const formatMinutes = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: tickets = [], isLoading } = useQuery<TicketListItem[]>({
    queryKey: ['dashboard-tickets'],
    queryFn: () => ticketService.getDashboardTickets(),
    refetchInterval: 30000,
  });

  const { data: analytics } = useQuery<SupportAnalytics>({
    queryKey: ['support-analytics'],
    queryFn: () => ticketService.getSupportAnalytics(),
    refetchInterval: 30000,
  });

  const metrics: DashboardMetrics = useMemo(() => {
    const total = tickets.length;
    const creados = tickets.filter((t) => t.estado === 'Creado').length;
    const enEjecucion = tickets.filter((t) => t.estado === 'En Ejecución').length;
    const solucionados = tickets.filter((t) => t.estado === 'Solucionado').length;
    return { total, creados, enEjecucion, solucionados };
  }, [tickets]);

  const maxCategoryTime = useMemo(() => {
    if (!analytics?.tiempos_por_categoria?.length) return 60;
    return Math.max(
      ...analytics.tiempos_por_categoria.map((c) =>
        Math.max(c.promedio_solucion_minutos, c.promedio_respuesta_minutos, 1)
      )
    );
  }, [analytics]);

  const recentTickets = useMemo(() => tickets.slice(0, 6), [tickets]);

  const metricCards = [
    { label: 'Total Tickets', value: metrics.total, icon: <Ticket className="h-5 w-5" />, color: 'from-slate-600 to-slate-500', textColor: 'text-slate-300' },
    { label: 'Creados', value: metrics.creados, icon: <AlertCircle className="h-5 w-5" />, color: 'from-rose-600 to-rose-500', textColor: 'text-rose-400' },
    { label: 'En Ejecución', value: metrics.enEjecucion, icon: <LoaderCircle className="h-5 w-5" />, color: 'from-amber-600 to-amber-500', textColor: 'text-amber-400' },
    { label: 'Solucionados', value: metrics.solucionados, icon: <CheckCircle2 className="h-5 w-5" />, color: 'from-emerald-600 to-emerald-500', textColor: 'text-emerald-400' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <LoaderCircle className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-sm font-medium">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Bienvenido/a, <span className="text-slate-200 font-medium">{user?.nombre}</span>. Resumen general de tickets.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nuevo Ticket
        </button>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 transition hover:border-slate-700/80"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                {card.icon}
              </div>
            </div>
            <p className={`mt-3 text-3xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Analíticas Avanzadas: Tiempos de Soporte y Encuesta de Satisfacción */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarjeta 1: Tiempos de Respuesta y Resolución */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">Tiempos de Soporte</h2>
                    <p className="text-xs text-slate-400">Atención inicial y resolución técnica</p>
                  </div>
                </div>
              </div>

              {/* KPIs de tiempos */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-medium truncate">1ª Respuesta</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-amber-400">
                    {formatMinutes(analytics.tiempo_promedio_primera_respuesta_minutos)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Hasta 'En Ejecución'</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-medium truncate">Solución Promedio</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                    {formatMinutes(analytics.tiempo_promedio_solucion_minutos)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Hasta 'Solucionado'</p>
                </div>
              </div>

              {/* Gráfico comparativo por categoría */}
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Resolución promedio por tipo de caso
              </h3>
              {analytics.tiempos_por_categoria.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  Aún no hay suficientes datos registrados para calcular tiempos por categoría.
                </p>
              ) : (
                <div className="space-y-3.5">
                  {analytics.tiempos_por_categoria.map((cat) => {
                    const pct = Math.min(
                      Math.max(Math.round((cat.promedio_solucion_minutos / maxCategoryTime) * 100), 8),
                      100
                    );
                    return (
                      <div key={cat.tipo_caso} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-200 font-medium truncate max-w-[200px]">
                            {cat.tipo_caso}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {formatMinutes(cat.promedio_solucion_minutos)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta 2: Nivel de Satisfacción del Usuario (CSAT) */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Star className="h-5 w-5 fill-amber-400/20" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">Satisfacción de Usuarios</h2>
                    <p className="text-xs text-slate-400">Encuestas de 1 a 5 estrellas</p>
                  </div>
                </div>
                {analytics.total_encuestas > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <ThumbsUp className="h-3 w-3" /> {analytics.porcentaje_satisfaccion}% positiva
                  </span>
                )}
              </div>

              {/* Puntuación General y Desglose de estrellas */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mb-5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
                {/* Score grande */}
                <div className="sm:col-span-5 text-center sm:border-r sm:border-slate-800/80 sm:pr-4">
                  <p className="text-4xl sm:text-5xl font-extrabold text-amber-400 tracking-tight">
                    {analytics.promedio_satisfaccion > 0 ? analytics.promedio_satisfaccion.toFixed(1) : '—'}
                  </p>
                  <div className="flex items-center justify-center gap-1 my-1.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= Math.round(analytics.promedio_satisfaccion)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {analytics.total_encuestas} {analytics.total_encuestas === 1 ? 'evaluación' : 'evaluaciones'}
                  </p>
                </div>

                {/* Barras de distribución por estrellas */}
                <div className="sm:col-span-7 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = analytics.distribucion_estrellas[String(stars)] || 0;
                    const pct = analytics.total_encuestas > 0 ? Math.round((count / analytics.total_encuestas) * 100) : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2 text-xs">
                        <span className="w-6 text-slate-400 font-mono text-[11px] flex items-center gap-0.5">
                          {stars}<Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 inline" />
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[11px] text-slate-500 font-mono">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comentarios o testimonios recientes */}
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Opiniones recientes de usuarios
              </h3>
              {analytics.ultimos_testimonios.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-3 text-center">
                  Aún no se han recibido opiniones con comentarios.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                  {analytics.ultimos_testimonios.slice(0, 3).map((testimonio) => (
                    <div
                      key={testimonio.ticket_id}
                      className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-300 truncate max-w-[150px]">
                          {testimonio.usuario_nombre}
                        </span>
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-2.5 w-2.5 ${
                                s <= testimonio.calificacion ? 'fill-amber-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {testimonio.comentario && (
                        <p className="text-slate-400 italic line-clamp-2 text-[11px]">
                          "{testimonio.comentario}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Distribución por Tipo de Caso */}
      {tickets.length > 0 && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Distribución por Tipo de Caso</h2>
          <div className="space-y-3">
            {Object.entries(
              tickets.reduce<Record<string, number>>((acc, t) => {
                acc[t.tipo_caso] = (acc[t.tipo_caso] || 0) + 1;
                return acc;
              }, {})
            )
              .sort(([, a], [, b]) => b - a)
              .map(([tipo, count]) => {
                const pct = Math.round((count / tickets.length) * 100);
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">{tipo}</span>
                      <span className="text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tickets Recientes */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Tickets Recientes</h2>
          <button
            onClick={() => navigate('/tickets')}
            className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition"
          >
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentTickets.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            <ClipboardList className="h-10 w-10 mx-auto mb-2 text-slate-600" />
            No hay tickets registrados aún.
          </div>
        ) : (
          <div className="space-y-2">
            {recentTickets.map((t) => {
              const badge = estadoBadge[t.estado] || estadoBadge.Creado;
              return (
                <button
                  key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  className="w-full flex items-start sm:items-center gap-3 sm:gap-4 rounded-xl p-3 sm:px-4 sm:py-3 text-left border border-slate-800/40 sm:border-transparent hover:border-slate-700/60 bg-slate-800/20 sm:bg-transparent hover:bg-slate-800/40 transition-all duration-200 group cursor-pointer"
                >
                  {/* ID del Ticket */}
                  <div className="shrink-0 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 text-xs font-bold group-hover:bg-blue-600/15 group-hover:text-blue-400 transition mt-0.5 sm:mt-0">
                    #{t.id}
                  </div>

                  {/* Contenedor principal de información */}
                  <div className="flex-1 min-w-0">
                    {/* Cabecera en móvil: Título e insignia de estado juntos */}
                    <div className="flex items-center justify-between gap-2 sm:hidden mb-1">
                      <p className="text-sm font-medium text-slate-200 truncate flex-1 min-w-0">{t.titulo}</p>
                      <div className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {t.estado}
                      </div>
                    </div>

                    {/* Título en pantallas medianas y escritorio */}
                    <p className="hidden sm:block text-sm font-medium text-slate-200 truncate">{t.titulo}</p>

                    {/* Metadatos (usuario, ubicación, fecha) con truncado y wrap */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 sm:text-slate-500 mt-0.5">
                      <span className="inline-flex items-center gap-1 min-w-0 max-w-[140px] sm:max-w-none truncate" title={t.usuario.nombre}>
                        <User className="h-3 w-3 shrink-0 text-slate-500" />
                        <span className="truncate">{t.usuario.nombre}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 min-w-0 max-w-[130px] sm:max-w-none truncate" title={t.ubicacion}>
                        <MapPin className="h-3 w-3 shrink-0 text-slate-500" />
                        <span className="truncate">{t.ubicacion}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3 shrink-0 text-slate-500" />
                        <span>{new Date(t.fecha_creacion).toLocaleDateString('es-CO')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Insignia de estado en escritorio */}
                  <div className={`hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                    {t.estado}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Crear Ticket */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(id) => navigate(`/tickets/${id}`)}
      />
    </div>
  );
};

export default Dashboard;
