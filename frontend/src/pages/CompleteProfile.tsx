import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services';
import { Building2, AlertCircle, Briefcase, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import ncpLogo from '../assets/ncp-isotipo.svg';

const AREAS_DISPONIBLES = [
  'Rectoría',
  'Coordinación Académica',
  'Secretaría',
  'Contabilidad',
  'Talento Humano',
  'Sistemas / TI',
  'Biblioteca',
  'Psicología',
  'Preescolar',
  'Primaria',
  'Bachillerato',
  'Enfermería',
  'Servicios Generales',
  'Otra',
];

export const CompleteProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [cargo, setCargo] = useState('');
  const [area, setArea] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!cargo.trim()) {
      setErrorMessage('Debes ingresar tu cargo.');
      return;
    }
    if (!area) {
      setErrorMessage('Debes seleccionar tu área.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedUser = await authService.completeProfile(cargo.trim(), area);
      updateUser(updatedUser);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al completar el perfil';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 items-center justify-center p-4 relative overflow-hidden">
      {/* Luces de fondo decorativas */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Tarjeta principal */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/60">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <img src={ncpLogo} alt="NCP Tickets" className="h-16 w-16" />
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider text-emerald-400 uppercase">
              <Building2 className="h-3.5 w-3.5" />
              Inversiones Oeding
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Completa tu Perfil
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Bienvenido/a <span className="font-semibold text-slate-200">{user?.nombre}</span>.
              <br />
              Para continuar, necesitamos que nos indiques tu cargo y área dentro de la institución.
            </p>
          </div>

          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              <div className="flex-1 text-xs leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Campo: Cargo */}
            <div>
              <label htmlFor="cargo" className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Briefcase className="h-4 w-4 text-emerald-400" />
                Cargo
              </label>
              <input
                id="cargo"
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ej: Docente, Coordinador, Secretaria..."
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
                disabled={isSubmitting}
              />
            </div>

            {/* Campo: Área */}
            <div>
              <label htmlFor="area" className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <MapPin className="h-4 w-4 text-emerald-400" />
                Área
              </label>
              <select
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                disabled={isSubmitting}
              >
                <option value="" disabled>
                  Selecciona tu área...
                </option>
                {AREAS_DISPONIBLES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isSubmitting || !cargo.trim() || !area}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-cyan-500 hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  Continuar al Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-5 text-center text-xs text-slate-500">
            Esta información se registra una sola vez y puede ser modificada por el administrador.
          </div>
        </div>

        {/* Copyright */}
        <p className="mt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Inversiones Oeding S.A.S. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default CompleteProfile;
