import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Layout } from '../components/Layout';
import { Login } from '../pages/Login';
import { CompleteProfile } from '../pages/CompleteProfile';
import { Dashboard } from '../pages/Dashboard';
import { TicketList } from '../pages/TicketList';
import { TicketDetail } from '../pages/TicketDetail';
import { UserManagement } from '../pages/UserManagement';
import { NotFound } from '../pages/NotFound';

import { useAuth } from '../hooks/useAuth';
import { MyTickets } from '../pages/MyTickets';

const IndexRedirect: React.FC = () => {
  const { isSoporteOrAdmin } = useAuth();
  return <Navigate to={isSoporteOrAdmin ? '/dashboard' : '/mis-tickets'} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Ruta pública: Login */}
      <Route path="/login" element={<Login />} />

      {/* Ruta protegida: Completar perfil (primer ingreso) */}
      <Route element={<ProtectedRoute requireSoporteOrAdmin={false} />}>
        <Route path="/complete-profile" element={<CompleteProfile />} />
      </Route>

      {/* Rutas protegidas con Layout (Todos los usuarios autenticados) */}
      <Route element={<ProtectedRoute requireSoporteOrAdmin={false} />}>
        <Route element={<Layout />}>
          {/* Rutas para Colaboradores (y accesibles para soporte/admin) */}
          <Route path="/mis-tickets" element={<MyTickets />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />

          {/* Rutas exclusivas para Soporte y Administrador */}
          <Route element={<ProtectedRoute allowedRoles={['Soporte', 'Administrador']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tickets" element={<TicketList />} />
          </Route>

          {/* Rutas exclusivas para Administrador */}
          <Route element={<ProtectedRoute allowedRoles={['Administrador']} />}>
            <Route path="/usuarios" element={<UserManagement />} />
          </Route>

          {/* Redirección por defecto según rol */}
          <Route path="/" element={<IndexRedirect />} />
        </Route>
      </Route>

      {/* Ruta 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
