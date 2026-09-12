import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ticketService } from '../services';
import type { TicketListItem } from '../types';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Eye,
  Loader2,
  ClipboardList,
  User,
  MapPin,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import { CreateTicketModal } from '../components/CreateTicketModal';

const estadoBadge: Record<string, { bg: string; text: string; dot: string }> = {
  Creado: { bg: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-400', dot: 'bg-amber-400' },
  'En Ejecución': { bg: 'bg-blue-500/10 border-blue-500/25', text: 'text-blue-400', dot: 'bg-blue-400' },
  Solucionado: { bg: 'bg-emerald-500/10 border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-400' },
};

const ESTADOS_FILTER = ['TODOS', 'Creado', 'En Ejecución', 'Solucionado'] as const;

export const MyTickets: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Consulta de los tickets propios del usuario
  const { data: tickets = [], isLoading } = useQuery<TicketListItem[]>({
    queryKey: ['my-tickets'],
    queryFn: ticketService.getMyTickets,
    refetchInterval: 30000,
  });

  // Filtrado por estado local
  const filteredTickets = useMemo(() => {
    if (estadoFilter === 'TODOS') return tickets;
    return tickets.filter((t) => t.estado === estadoFilter);
  }, [tickets, estadoFilter]);

  // Métricas rápidas del usuario
  const metrics = useMemo(() => {
    const total = tickets.length;
    const creados = tickets.filter((t) => t.estado === 'Creado').length;
    const enEjecucion = tickets.filter((t) => t.estado === 'En Ejecución').length;
    const solucionados = tickets.filter((t) => t.estado === 'Solucionado').length;
    return { total, creados, enEjecucion, solucionados };
  }, [tickets]);

  // Columnas para TanStack Table
  const columns = useMemo<ColumnDef<TicketListItem>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 70,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-bold text-slate-400">#{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'titulo',
        header: 'Asunto / Título',
        size: 260,
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-slate-200 line-clamp-1">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'ubicacion',
        header: 'Ubicación',
        size: 150,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            <span className="truncate">{getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'tipo_caso',
        header: 'Tipo',
        size: 130,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Tag className="h-3 w-3 text-slate-500 shrink-0" />
            <span>{getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        size: 130,
        cell: ({ getValue }) => {
          const estado = getValue<string>();
          const badge = estadoBadge[estado] || estadoBadge.Creado;
          return (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.bg} ${badge.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {estado}
            </span>
          );
        },
      },
      {
        id: 'asignado',
        header: 'Técnico Asignado',
        size: 180,
        cell: ({ row }) => {
          const asignado = row.original.asignado;
          return asignado ? (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-slate-200 font-medium block truncate">{asignado.nombre}</span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">Asignando técnico...</span>
          );
        },
      },
      {
        accessorKey: 'fecha_creacion',
        header: 'Fecha de Registro',
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-400">
            {new Date(getValue<string>()).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        id: 'acciones',
        header: '',
        size: 60,
        enableSorting: false,
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tickets/${row.original.id}`);
            }}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition"
            title="Ver seguimiento"
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [navigate]
  );

  const table = useReactTable({
    data: filteredTickets,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-sm font-medium">Cargando tus solicitudes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Mis Tickets de Soporte</h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
              <Sparkles className="h-3 w-3" /> Colaborador
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Hola <span className="text-slate-200 font-medium">{user?.nombre}</span>. Aquí puedes consultar el estado de tus requerimientos técnicos.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nuevo Ticket
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registrados</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-100">{metrics.total}</p>
          <p className="mt-1 text-xs text-slate-500">Historial completo de solicitudes</p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En Atención / Pendientes</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-amber-400">{metrics.creados + metrics.enEjecucion}</p>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.creados} nuevos · {metrics.enEjecucion} en ejecución
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Solucionados</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-400">{metrics.solucionados}</p>
          <p className="mt-1 text-xs text-slate-500">Casos resueltos satisfactoriamente</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar por asunto, ID, bloque o técnico..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>

        {/* Estado Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {ESTADOS_FILTER.map((estado) => {
            const isActive = estadoFilter === estado;
            return (
              <button
                key={estado}
                onClick={() => setEstadoFilter(estado)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 bg-slate-900/40 border border-slate-800/80'
                }`}
              >
                {estado === 'TODOS' ? 'Todos' : estado}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-xl shadow-black/20">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/40 text-slate-500">
              <ClipboardList className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">No hay tickets para mostrar</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {estadoFilter !== 'TODOS' || globalFilter
                ? 'No se encontraron tickets con los filtros aplicados.'
                : 'Aún no has registrado solicitudes de soporte técnico. ¡Crea una cuando lo necesites!'}
            </p>
            {tickets.length === 0 && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Registrar mi primer ticket
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className={`px-4 py-3.5 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none hover:text-slate-200' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-slate-500">
                              {{
                                asc: <ArrowUp className="h-3 w-3 text-blue-400" />,
                                desc: <ArrowDown className="h-3 w-3 text-blue-400" />,
                              }[header.column.getIsSorted() as string] ?? (
                                <ArrowUpDown className="h-3 w-3 opacity-40" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/tickets/${row.original.id}`)}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredTickets.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-800/80 bg-slate-950/30 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>
                Página <strong className="text-slate-200">{table.getState().pagination.pageIndex + 1}</strong> de{' '}
                <strong className="text-slate-200">{table.getPageCount() || 1}</strong>
              </span>
              <span className="text-slate-600">·</span>
              <span>{filteredTickets.length} tickets</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear Ticket */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(id) => navigate(`/tickets/${id}`)}
      />
    </div>
  );
};

export default MyTickets;
