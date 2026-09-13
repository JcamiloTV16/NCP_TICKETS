import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Ticket,
  Users,
  LogOut,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import ncpLogo from '../assets/ncp-isotipo.svg';
import { CreateTicketModal } from './CreateTicketModal';





export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isUsuario = user?.rol === 'Usuario';
  const isAdmin = user?.rol === 'Administrador';

  const filteredNav = isUsuario
    ? [{ to: '/mis-tickets', label: 'Mis Tickets', icon: <Ticket className="h-5 w-5" /> }]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
        { to: '/tickets', label: 'Tickets', icon: <Ticket className="h-5 w-5" /> },
        ...(isAdmin ? [{ to: '/usuarios', label: 'Usuarios', icon: <Users className="h-5 w-5" /> }] : []),
      ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-blue-600/15 text-blue-400 shadow-sm shadow-blue-500/10 border border-blue-500/20'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
    }`;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <img src={ncpLogo} alt="NCP" className="h-9 w-9 shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-white leading-tight truncate">NCP Tickets</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase truncate">Inversiones Oeding</p>
          </div>
        )}
      </div>

      {/* Separador */}
      <div className="mx-4 border-t border-slate-800/80 mb-3" />

      {/* Botón Nuevo Ticket */}
      <div className="px-3 mb-3">
        <button
          onClick={() => {
            setIsCreateOpen(true);
            setMobileOpen(false);
          }}
          className={`w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition cursor-pointer ${
            collapsed ? 'px-0' : 'px-3 text-sm'
          }`}
          title="Crear Nuevo Ticket"
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">Nuevo Ticket</span>}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-3">
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={linkClass}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User card + logout */}
      <div className="px-3 pb-4 mt-auto space-y-2">
        <div className="mx-1 border-t border-slate-800/80 mb-3" />

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/40">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-blue-400">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.nombre}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Shield className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                <span className="truncate">{user?.rol}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className={`flex items-center gap-3 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 ${
            collapsed ? 'justify-center px-3 py-2.5' : 'w-full px-3 py-2.5'
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar — Desktop */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-800/80 bg-slate-900/70 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="mx-3 mb-3 flex items-center justify-center rounded-lg py-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — Mobile */}
      <aside
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800/80 bg-slate-900 transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-5 p-1 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
          className="flex items-center justify-between min-h-[3.5rem] px-4 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl lg:hidden select-none"
        >
          <button onClick={() => setMobileOpen(true)} className="p-1.5 text-slate-400 hover:text-white" aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src={ncpLogo} alt="NCP" className="h-7 w-7" />
            <span className="text-sm font-bold text-white tracking-wide">NCP Tickets</span>
          </div>
          <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-rose-400" aria-label="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        {/* Page content */}
        <main
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          }}
          className="flex-1 overflow-auto"
        >
          <Outlet />
        </main>
      </div>

      {/* Modal global de Crear Ticket */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(id) => navigate(`/tickets/${id}`)}
      />
    </div>
  );
};

export default Layout;
