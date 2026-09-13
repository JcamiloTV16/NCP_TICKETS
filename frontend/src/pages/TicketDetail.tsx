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
  Star,
} from 'lucide-react';

const estadoBadge: Record<string, { bg: string; text: string; dot: string }> = {
  Creado: { bg: 'bg-rose-500/10 border-rose-500/25', text: 'text-rose-400', dot: 'bg-rose-400' },
  'En Ejecución': { bg: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-400', dot: 'bg-amber-400' },
  Solucionado: { bg: 'bg-emerald-500/10 border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-400' },
};

const ESTADOS: EstadoTicket[] = ['Creado', 'En Ejecución', 'Solucionado'];

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const navigate = useNavigate();
  const { user, isSoporteOrAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState<string>('');

  // Fetch ticket
  const { data: ticket, isLoading: loadingTicket } = useQuery<Ticket>({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketService.getTicketById(ticketId),
    enabled: !isNaN(ticketId),
  });

  // Mutación para calificar ticket
  const ratingMutation = useMutation({
    mutationFn: (payload: { calificacion: number; comentario?: string }) =>
      ticketService.calificarTicket(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    },
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Botón para volver */}
      <button
        onClick={() => navigate(isSoporteOrAdmin ? '/tickets' : '/mis-tickets')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a {isSoporteOrAdmin ? 'tickets' : 'mis tickets'}
      </button>

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-slate-500 font-bold">#{ticket.id}</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badge.bg} ${badge.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {ticket.estado}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white break-words">{ticket.titulo}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenido principal — 2 columnas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descripción */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripción</h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{ticket.descripcion}</p>
          </div>

          {/* Encuesta de Satisfacción (solo en tickets Solucionados) */}
          {ticket.estado === 'Solucionado' && (
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-slate-900/70 p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Star className="h-5 w-5 fill-amber-400/20" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">Encuesta de Satisfacción</h2>
                    <p className="text-xs text-slate-400">Califica la atención y servicio recibido</p>
                  </div>
                </div>
                {ticket.calificacion && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    {ticket.calificacion} / 5
                  </span>
                )}
              </div>

              {ticket.calificacion ? (
                /* Calificación ya registrada */
                <div className="rounded-xl bg-slate-950/40 border border-slate-800/80 p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= ticket.calificacion!
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-xs font-semibold text-amber-400">
                      {ticket.calificacion === 5
                        ? '¡Excelente servicio!'
                        : ticket.calificacion === 4
                        ? 'Buena atención'
                        : ticket.calificacion === 3
                        ? 'Aceptable'
                        : ticket.calificacion === 2
                        ? 'Regular'
                        : 'Mala'}
                    </span>
                  </div>
                  {ticket.comentario_calificacion && (
                    <p className="text-xs text-slate-300 italic bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                      "{ticket.comentario_calificacion}"
                    </p>
                  )}
                  {ticket.fecha_calificacion && (
                    <p className="text-[11px] text-slate-500">
                      Evaluado el {new Date(ticket.fecha_calificacion).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>
              ) : (user?.id === ticket.usuario_id || user?.rol === 'Administrador') ? (
                /* Formulario interactivo para calificar */
                <div className="space-y-3.5 pt-1">
                  <p className="text-xs text-slate-300">
                    ¿Cómo calificarías la resolución y trato recibido en este ticket?
                  </p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                          title={`${star} estrella${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${
                              active
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                : 'text-slate-600 hover:text-slate-500'
                            }`}
                          />
                        </button>
                      );
                    })}
                    {rating > 0 && (
                      <span className="text-xs font-semibold text-amber-400 ml-2">
                        {rating === 5 ? '¡Excelente!' : rating === 4 ? 'Buena' : rating === 3 ? 'Aceptable' : rating === 2 ? 'Regular' : 'Mala'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1.5">
                      Comentario o sugerencia sobre la atención (opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Escribe aquí tu opinión sobre el soporte brindado..."
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={rating === 0 || ratingMutation.isPending}
                      onClick={() =>
                        ratingMutation.mutate({
                          calificacion: rating,
                          comentario: ratingComment.trim() || undefined,
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-slate-950 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-lg shadow-amber-500/10"
                    >
                      {ratingMutation.isPending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Enviar Calificación
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Mensaje para técnicos */
                <p className="text-xs text-slate-500 italic">
                  El usuario solicitante aún no ha calificado este ticket.
                </p>
              )}
            </div>
          )}

          {/* Comentarios */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Comentarios ({comentarios.length})
              </h2>
            </div>

            {/* Lista de comentarios */}
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

        {/* Barra lateral — columna derecha */}
        <div className="space-y-4">
          {/* Tarjeta de detalles */}
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

              {ticket.estado === 'Solucionado' && (
                <div className="flex items-start gap-3">
                  <Star className="h-4 w-4 text-amber-400 mt-0.5 shrink-0 fill-amber-400/20" />
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase">Satisfacción</p>
                    {ticket.calificacion ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-bold text-amber-400">{ticket.calificacion} / 5</span>
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${s <= ticket.calificacion! ? 'fill-amber-400' : 'text-slate-700'}`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Pendiente de calificar</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta de acciones (solo Soporte y Administrador) */}
          {isSoporteOrAdmin && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</h2>

              {/* Cambiar estado */}
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

              {/* Reasignar técnico */}
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
