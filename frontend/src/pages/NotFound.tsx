import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-blue-400">
          <HelpCircle className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
        <p className="mt-2 text-lg font-semibold text-slate-200">Página no encontrada</p>
        <p className="mt-1 text-sm text-slate-400">
          La ruta que estás buscando no existe en el sistema de tickets de Inversiones Oeding.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
export default NotFound;
