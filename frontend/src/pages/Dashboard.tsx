import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ticketService } from '../services';
import type { TicketListItem, DashboardMetrics } from '../types';
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
} from 'lucide-react';
import { CreateTicketModal } from '../components/CreateTicketModal';

const estadoBadge: Record<string, { bg: string; text: string; dot: string }> = {
  Creado: { bg: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-400', dot: 'bg-amber-400' },
  'En Ejecución': { bg: 'bg-blue-500/10 border-blue-500/25', text: 'text-blue-400', dot: 'bg-blue-400' },
  Solucionado: { bg: 'bg-emerald-500/10 border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-400' },
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

  const metrics: DashboardMetrics = useMemo(() => {
    const total = tickets.length;
    const creados = tickets.filter((t) => t.estado === 'Creado').length;
    const enEjecucion = tickets.filter((t) => t.estado === 'En Ejecución').length;
    const solucionados = tickets.filter((t) => t.estado === 'Solucionado').length;
    return { total, creados, enEjecucion, solucionados };
  }, [tickets]);

  const recentTickets = useMemo(() => tickets.slice(0, 6), [tickets]);

  const metricCards = [
    { label: 'Total Tickets', value: metrics.total, icon: <Ticket className="h-5 w-5" />, color: 'from-slate-600 to-slate-500', textColor: 'text-slate-300' },
    { label: 'Creados', value: metrics.creados, icon: <AlertCircle className="h-5 w-5" />, color: 'from-amber-600 to-amber-500', textColor: 'text-amber-400' },
    { label: 'En Ejecución', value: metrics.enEjecucion, icon: <LoaderCircle className="h-5 w-5" />, color: 'from-blue-600 to-blue-500', textColor: 'text-blue-400' },
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
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 transition hover:border-slate-700/80"
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

      {/* Distribution by Tipo de Caso */}
      {tickets.length > 0 && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
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

      {/* Recent Tickets */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
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
                  className="w-full flex items-center gap-4 rounded-xl px-4 py-3 text-left border border-transparent hover:border-slate-700/60 hover:bg-slate-800/40 transition-all duration-200 group"
                >
                  <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 text-xs font-bold group-hover:bg-blue-600/15 group-hover:text-blue-400 transition">
                    #{t.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{t.titulo}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{t.usuario.nombre}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.ubicacion}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(t.fecha_creacion).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                  <div className={`shrink-0 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
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
