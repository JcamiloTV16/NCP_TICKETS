import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, AlertCircle, Building2 } from 'lucide-react';
import ncpLogo from '../assets/ncp-isotipo.svg';

export const Login: React.FC = () => {
  const { loginWithGoogleToken, isAuthenticated, isSoporteOrAdmin, user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir si ya está autenticado según rol
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const defaultDest = isSoporteOrAdmin ? '/dashboard' : '/mis-tickets';
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || defaultDest;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isSoporteOrAdmin, user, navigate, location]);

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setErrorMessage('No se recibió la credencial de Google.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      await loginWithGoogleToken(response.credential);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMessage('Fallo en la autenticación con Google. Por favor, intenta de nuevo.');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 items-center justify-center p-4 relative overflow-hidden">
      {/* Luces de fondo decorativas con gradiente */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Tarjeta principal */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/60">
          {/* Header con marca */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <img src={ncpLogo} alt="NCP Tickets" className="h-16 w-16" />
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider text-blue-400 uppercase">
              <Building2 className="h-3.5 w-3.5" />
              Inversiones Oeding
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
              NCP Tickets Web
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Portal de gestión técnica y soporte de incidencias. <br></br>  Inicia sesión con tu cuenta de Google Institucional.
            </p>
          </div>

          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              <div className="flex-1 text-xs leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Botón de Google OAuth */}
          <div className="mt-8 flex flex-col items-center justify-center">
            {isProcessing ? (
              <div className="flex items-center justify-center py-3 text-sm text-blue-400 font-medium animate-pulse">
                Autenticando credenciales con base de datos...
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text="signin_with"
                />
              </div>
            )}
          </div>

          {/* Footer Informativo */}
          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500/80" />
              <span>Conectado a Neon PostgreSQL (Cloud Serverless)</span>
            </div>
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
export default Login;
