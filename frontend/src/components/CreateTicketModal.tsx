import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { ticketService, usuarioService } from '../services';
import type { TicketCreate, Usuario } from '../types';
import {
  X,
  PlusCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Shield,
  Layers,
  MapPin,
  Building2,
  FileText,
} from 'lucide-react';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (ticketId: number) => void;
}

const TIPOS_CASO = [
  'VideoBeams',
  'Red / Conectividad',
  'Impresoras / Periféricos',
  'Telefonía / Comunicaciones',
  'Hardware',
  'Software',
  'Otro',
];

const UBICACIONES_SUGERIDAS = [
  'Bloque A',
  'Bloque B',
  'Bloque C',
  'Bloque D',
  'Bloque E',
  'Bloque F',
  'Bloque G',
  'Bloque H',
];

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdminOrSoporte = user?.rol === 'Administrador' || user?.rol === 'Soporte';

  // State
  const [titulo, setTitulo] = useState('');
  const [tipoCaso, setTipoCaso] = useState('VideoBeams');
  const [bloque, setBloque] = useState(UBICACIONES_SUGERIDAS[0] || 'Bloque A');
  const [salon, setSalon] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [solicitanteModo, setSolicitanteModo] = useState<'yo' | 'otro'>('yo');
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | undefined>(undefined);
  const [asignadoModo, setAsignadoModo] = useState<'auto' | 'manual'>('auto');
  const [selectedAsignadoId, setSelectedAsignadoId] = useState<number | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Queries for users and soporte
  const { data: todosUsuarios = [] } = useQuery<Usuario[]>({
    queryKey: ['usuarios-todos'],
    queryFn: usuarioService.getUsuarios,
    enabled: isOpen && isAdminOrSoporte,
  });

  const soporteUsers = todosUsuarios.filter(
    (u) => u.rol === 'Soporte' || u.rol === 'Administrador'
  );

  const resetForm = () => {
    setTitulo('');
    setTipoCaso('Hardware');
    setBloque(UBICACIONES_SUGERIDAS[0] || 'Bloque A');
    setSalon('');
    setDescripcion('');
    setSolicitanteModo('yo');
    setSelectedUsuarioId(undefined);
    setAsignadoModo('auto');
    setSelectedAsignadoId(undefined);
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: (payload: TicketCreate) => ticketService.createTicket(payload),
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      handleClose();
      if (onSuccess) {
        onSuccess(newTicket.id);
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Error al crear el ticket. Revisa los campos e intenta de nuevo.';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!titulo.trim()) {
      setErrorMsg('El título es requerido.');
      return;
    }
    if (!salon.trim()) {
      setErrorMsg('Por favor especifica el salón o espacio administrativo (ej: 11A, Contabilidad).');
      return;
    }
    if (!descripcion.trim()) {
      setErrorMsg('La descripción es requerida.');
      return;
    }

    const payload: TicketCreate = {
      titulo: titulo.trim(),
      tipo_caso: tipoCaso,
      ubicacion: `${bloque} - ${salon.trim()}`,
      descripcion: descripcion.trim(),
    };

    if (isAdminOrSoporte && solicitanteModo === 'otro' && selectedUsuarioId) {
      payload.usuario_id = selectedUsuarioId;
    }

    if (isAdminOrSoporte && asignadoModo === 'manual' && selectedAsignadoId) {
      payload.asignado_a = selectedAsignadoId;
    }

    createMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-blue-500/10 transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Crear Nuevo Ticket</h3>
              <p className="text-xs text-slate-400">
                Registra un incidente o solicitud de soporte técnico
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Título del Ticket <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Falla en equipo portátil, no enciende o pantalla azul"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              required
            />
          </div>

          {/* Solicitante (si es Admin o Soporte) */}
          {isAdminOrSoporte && (
            <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  Solicitante del Ticket
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSolicitanteModo('yo')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${solicitanteModo === 'yo'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-800'
                      }`}
                  >
                    Para mí ({user?.nombre})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSolicitanteModo('otro')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${solicitanteModo === 'otro'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-800'
                      }`}
                  >
                    En nombre de otro colaborador
                  </button>
                </div>
              </div>

              {solicitanteModo === 'otro' && (
                <div className="pt-1">
                  <select
                    value={selectedUsuarioId || ''}
                    onChange={(e) => setSelectedUsuarioId(Number(e.target.value) || undefined)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    required
                  >
                    <option value="">-- Selecciona el colaborador solicitante --</option>
                    {todosUsuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.email}) — {u.area || 'Sin área'} / {u.cargo || 'Sin cargo'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Grid: Tipo de Caso, Bloque & Salón */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo de Caso */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                Tipo de Caso <span className="text-rose-400">*</span>
              </label>
              <select
                value={tipoCaso}
                onChange={(e) => setTipoCaso(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              >
                {TIPOS_CASO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Bloque */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                Bloque <span className="text-rose-400">*</span>
              </label>
              <select
                value={bloque}
                onChange={(e) => setBloque(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              >
                {UBICACIONES_SUGERIDAS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Salón */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                Salón <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={salon}
                onChange={(e) => setSalon(e.target.value)}
                placeholder="Ej: 11A o Contabilidad"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                required
              />
            </div>
          </div>

          {/* Asignación Técnica (si es Admin o Soporte) */}
          {isAdminOrSoporte && (
            <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-cyan-400" />
                  Asignación de Soporte
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAsignadoModo('auto')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${asignadoModo === 'auto'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-800'
                      }`}
                  >
                    Automática (Balanceo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAsignadoModo('manual')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${asignadoModo === 'manual'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-800'
                      }`}
                  >
                    Asignar a técnico específico
                  </button>
                </div>
              </div>

              {asignadoModo === 'manual' && (
                <div className="pt-1">
                  <select
                    value={selectedAsignadoId || ''}
                    onChange={(e) => setSelectedAsignadoId(Number(e.target.value) || undefined)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
                  >
                    <option value="">-- Selecciona el técnico de soporte --</option>
                    {soporteUsers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({s.cargo || s.rol})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              Descripción del Problema <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalla los síntomas observados, mensajes de error, equipos afectados y cualquier información relevante..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition resize-none"
              required
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando Ticket...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Crear Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
