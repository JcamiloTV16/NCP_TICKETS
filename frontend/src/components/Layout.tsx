import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Ticket,
  Users,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import ncpLogo from '../assets/ncp-isotipo.svg';
import { CreateTicketModal } from './CreateTicketModal';
import { NotificationBell } from './NotificationBell';

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      {/* Sidebar — Desktop */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-800/80 bg-slate-900/70 backdrop-blur-xl transition-all duration-300 shrink-0 h-full select-none ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 pt-6 pb-4 shrink-0">
          <img src={ncpLogo} alt="NCP" className="h-9 w-9 shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-white leading-tight truncate">NCP Tickets</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase truncate">
                Inversiones Oeding
              </p>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="mx-4 border-t border-slate-800/80 mb-3 shrink-0" />

        {/* Botón Nuevo Ticket */}
        <div className="px-3 mb-3 shrink-0">
          <button
            onClick={() => setIsCreateOpen(true)}
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition cursor-pointer ${
              collapsed ? 'px-0' : 'px-3 text-sm'
            }`}
            title="Crear Nuevo Ticket"
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">Nuevo Ticket</span>}
          </button>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClass}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer: solo botón de contraer y extender menú */}
        <div className="p-3 border-t border-slate-800/80 mt-auto shrink-0">
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className={`w-full flex items-center rounded-xl py-2 px-2.5 text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-slate-800/80 hover:border-slate-700/80 transition cursor-pointer ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
            title={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            {!collapsed && <span className="truncate text-slate-300 font-medium">Contraer menú</span>}
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-400 hover:text-white shrink-0" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-slate-400 hover:text-white shrink-0" />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — Mobile Drawer */}
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
          className="absolute right-3 top-5 p-1 text-slate-400 hover:text-white cursor-pointer"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 pt-6 pb-4 shrink-0">
          <img src={ncpLogo} alt="NCP" className="h-9 w-9 shrink-0" />
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-white leading-tight truncate">NCP Tickets</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase truncate">
              Inversiones Oeding
            </p>
          </div>
        </div>

        <div className="mx-4 border-t border-slate-800/80 mb-3 shrink-0" />

        {/* Botón Nuevo Ticket Mobile */}
        <div className="px-3 mb-3 shrink-0">
          <button
            onClick={() => {
              setIsCreateOpen(true);
              setMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition cursor-pointer px-3 text-sm"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Nuevo Ticket</span>
          </button>
        </div>

        {/* Links Mobile */}
        <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClass}
              onClick={() => setMobileOpen(false)}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Column */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile top bar */}
        <header
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
          className="flex items-center justify-between min-h-[3.5rem] px-4 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl lg:hidden select-none shrink-0"
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src={ncpLogo} alt="NCP" className="h-7 w-7" />
            <span className="text-sm font-bold text-white tracking-wide">NCP Tickets</span>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Desktop Top Header Bar (Persistente / Fijo) */}
        <header className="hidden lg:flex items-center justify-between h-16 px-6 sm:px-8 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-xl shrink-0 select-none">
          {/* Status & Breadcrumb */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/40 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-400">Sistema en línea</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 font-medium">Inversiones Oeding</span>
            </div>
          </div>

          {/* Quick Actions & Notifications & User Profile */}
          <div className="flex items-center gap-3.5">
            <NotificationBell align="right" />

            <div className="h-5 w-px bg-slate-800" />

            <div className="flex items-center gap-3 pl-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase shadow-sm">
                {user?.nombre ? user.nombre.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="text-left hidden xl:block">
                <p className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[150px]">
                  {user?.nombre}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Shield className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                  <span className="text-amber-400/90 font-medium">{user?.rol}</span>
                  {user?.cargo && user.cargo !== 'Sin asignar' && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 truncate max-w-[110px]">{user?.cargo}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content view container */}
        <main
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
          }}
          className="flex-1 min-h-0 overflow-y-auto flex flex-col"
        >
          <Outlet />
        </main>
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

export default Layout;
