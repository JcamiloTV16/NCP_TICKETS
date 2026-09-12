import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { ticketService, comentarioService } from '../services';
import { usuarioService } from '../services';
import type { Ticket, Comentario, EstadoTicket, Usuario } from '../types';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  User,
  Shield,
  Tag,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Calendar,
} from 'lucide-react';

const estadoBadge: Record<string, { bg: string; text: string; dot: string }> = {
  Creado: { bg: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-400', dot: 'bg-amber-400' },
  'En Ejecución': { bg: 'bg-blue-500/10 border-blue-500/25', text: 'text-blue-400', dot: 'bg-blue-400' },
  Solucionado: { bg: 'bg-emerald-500/10 border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-400' },
};

const ESTADOS: EstadoTicket[] = ['Creado', 'En Ejecución', 'Solucionado'];

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const navigate = useNavigate();
  const { isSoporteOrAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');

  // Fetch ticket
  const { data: ticket, isLoading: loadingTicket } = useQuery<Ticket>({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketService.getTicketById(ticketId),
    enabled: !isNaN(ticketId),
  });

  // Fetch comments
  const { data: comentarios = [], isLoading: loadingComments } = useQuery<Comentario[]>({
    queryKey: ['comentarios', ticketId],
    queryFn: () => comentarioService.getComentarios(ticketId),
    enabled: !isNaN(ticketId),
  });

  // Fetch soporte users for reassignment
  const { data: usuarios = [] } = useQuery<Usuario[]>({
    queryKey: ['usuarios'],
    queryFn: () => usuarioService.getUsuarios(),
    enabled: isSoporteOrAdmin,
  });

  // Update ticket mutation
  const updateMutation = useMutation({
    mutationFn: (payload: { estado?: EstadoTicket; asignado_a?: number | null }) =>
      ticketService.updateTicket(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-tickets'] });
    },
  });

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: (comentario: string) =>
      comentarioService.addComentario(ticketId, { comentario }),
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['comentarios', ticketId] });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment.trim());
  };

  if (loadingTicket) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-sm font-medium">Cargando ticket...</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-slate-400">
        <AlertCircle className="h-10 w-10 mb-3 text-slate-500" />
        <p className="font-medium">Ticket no encontrado</p>
        <button
          onClick={() => navigate(isSoporteOrAdmin ? '/tickets' : '/mis-tickets')}
          className="mt-3 text-sm text-blue-400 hover:text-blue-300"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  const badge = estadoBadge[ticket.estado] || estadoBadge.Creado;
  const soporteUsers = usuarios.filter((u) => u.rol === 'Soporte' || u.rol === 'Administrador');

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(isSoporteOrAdmin ? '/tickets' : '/mis-tickets')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a {isSoporteOrAdmin ? 'tickets' : 'mis tickets'}
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-slate-500 font-bold">#{ticket.id}</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badge.bg} ${badge.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {ticket.estado}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">{ticket.titulo}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripción</h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{ticket.descripcion}</p>
          </div>

          {/* Comments */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Comentarios ({comentarios.length})
              </h2>
            </div>

            {/* Comments list */}
            {loadingComments ? (
              <div className="flex items-center gap-2 py-4 text-slate-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
              </div>
            ) : comentarios.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No hay comentarios aún.</p>
            ) : (
              <div className="space-y-4 mb-6">
                {comentarios.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400 text-xs font-bold mt-0.5">
                      {c.usuario.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-200">{c.usuario.nombre}</span>
                        <span className="text-slate-500">
                          {new Date(c.fecha_creacion).toLocaleString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300 leading-relaxed">{c.comentario}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment form */}
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition"
                disabled={commentMutation.isPending}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || commentMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar — right col */}
        <div className="space-y-4">
          {/* Info card */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detalles</h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500 uppercase">Solicitante</p>
                  <p className="text-sm text-slate-200">{ticket.usuario.nombre}</p>
                  <p className="text-[11px] text-slate-500">{ticket.usuario.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500 uppercase">Ubicación</p>
                  <p className="text-sm text-slate-200">{ticket.ubicacion}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500 uppercase">Tipo de Caso</p>
                  <p className="text-sm text-slate-200">{ticket.tipo_caso}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500 uppercase">Asignado a</p>
                  <p className="text-sm text-slate-200">{ticket.asignado?.nombre ?? 'Sin asignar'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500 uppercase">Creado</p>
                  <p className="text-sm text-slate-200">
                    {new Date(ticket.fecha_creacion).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              {ticket.fecha_solucion && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase">Solucionado</p>
                    <p className="text-sm text-emerald-400">
                      {new Date(ticket.fecha_solucion).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions card (solo Soporte y Administrador) */}
          {isSoporteOrAdmin && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</h2>

              {/* Change status */}
              <div>
                <label className="text-[11px] text-slate-500 uppercase block mb-1.5">Cambiar Estado</label>
                <div className="flex gap-1.5 flex-wrap">
                  {ESTADOS.map((estado) => {
                    const b = estadoBadge[estado];
                    const isActive = ticket.estado === estado;
                    return (
                      <button
                        key={estado}
                        disabled={isActive || updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ estado })}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          isActive
                            ? `${b.bg} ${b.text} cursor-default`
                            : 'border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 cursor-pointer'
                        } disabled:opacity-60`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? b.dot : 'bg-slate-600'}`} />
                        {estado}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reassign */}
              {soporteUsers.length > 0 && (
                <div>
                  <label className="text-[11px] text-slate-500 uppercase block mb-1.5">Reasignar</label>
                  <select
                    value={ticket.asignado_a ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      updateMutation.mutate({ asignado_a: val });
                    }}
                    disabled={updateMutation.isPending}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 appearance-none transition"
                  >
                    <option value="">Sin asignar</option>
                    {soporteUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.rol})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {updateMutation.isPending && (
                <div className="flex items-center gap-2 text-xs text-blue-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Actualizando...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
