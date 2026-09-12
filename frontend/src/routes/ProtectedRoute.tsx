import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert, LogOut, Loader2 } from 'lucide-react';

import type { RolUsuario } from '../types';

interface ProtectedRouteProps {
  requireSoporteOrAdmin?: boolean;
  allowedRoles?: RolUsuario[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requireSoporteOrAdmin = false,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading, needsProfileCompletion, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-lg font-medium tracking-wide">
            Cargando sesión de Inversiones Oeding...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirigir a completar perfil si es primer ingreso
  // (excepto si ya estamos en /complete-profile)
  if (needsProfileCompletion && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Validación de Rol RBAC
  const effectiveAllowedRoles = allowedRoles || (requireSoporteOrAdmin ? ['Soporte', 'Administrador'] : undefined);

  if (effectiveAllowedRoles && user?.rol && !effectiveAllowedRoles.includes(user.rol)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-white">
        <div className="w-full max-w-md rounded-2xl bg-slate-900/90 border border-slate-800 p-8 shadow-2xl backdrop-blur-sm text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-100">Acceso Restringido</h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Hola <span className="font-semibold text-slate-200">{user?.nombre}</span> ({user?.email}).
            No tienes los permisos necesarios para acceder a esta sección.
          </p>

          <div className="mt-4 rounded-lg bg-slate-950/60 p-3 text-xs text-slate-400 border border-slate-800/80">
            Tu rol actual asignado es: <span className="font-bold text-slate-200 uppercase">{user?.rol}</span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => window.location.href = user?.rol === 'Usuario' ? '/mis-tickets' : '/dashboard'}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 cursor-pointer"
            >
              Ir a mi inicio ({user?.rol === 'Usuario' ? 'Mis Tickets' : 'Dashboard'})
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión e intentar con otra cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
