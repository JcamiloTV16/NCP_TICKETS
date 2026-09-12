import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Loader2,
  ClipboardList,
  User,
  MapPin,
  Plus,
} from 'lucide-react';
import { CreateTicketModal } from '../components/CreateTicketModal';

const estadoBadge: Record<string, { bg: string; text: string; dot: string }> = {
  Creado: { bg: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-400', dot: 'bg-amber-400' },
  'En Ejecución': { bg: 'bg-blue-500/10 border-blue-500/25', text: 'text-blue-400', dot: 'bg-blue-400' },
  Solucionado: { bg: 'bg-emerald-500/10 border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-400' },
};

const ESTADOS_FILTER = ['TODOS', 'Creado', 'En Ejecución', 'Solucionado'] as const;

export const TicketList: React.FC = () => {
  const navigate = useNavigate();
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: true }]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: tickets = [], isLoading } = useQuery<TicketListItem[]>({
    queryKey: ['dashboard-tickets', estadoFilter],
    queryFn: () =>
      ticketService.getDashboardTickets({
        estado: estadoFilter !== 'TODOS' ? estadoFilter : undefined,
      }),
    refetchInterval: 30000,
  });

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
        header: 'Título',
        size: 280,
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-slate-200 line-clamp-1">{getValue<string>()}</span>
        ),
      },
      {
        id: 'solicitante',
        header: 'Solicitante',
        accessorFn: (row) => row.usuario.nombre,
        size: 160,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 text-slate-400">
              <User className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs text-slate-300 truncate">{row.original.usuario.nombre}</span>
          </div>
        ),
      },
      {
        accessorKey: 'ubicacion',
        header: 'Ubicación',
        size: 140,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'tipo_caso',
        header: 'Tipo',
        size: 130,
        cell: ({ getValue }) => (
          <span className="inline-flex items-center rounded-md bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
            {getValue<string>()}
          </span>
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
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {estado}
            </span>
          );
        },
      },
      {
        id: 'asignado',
        header: 'Asignado',
        accessorFn: (row) => row.asignado?.nombre ?? 'Sin asignar',
        size: 140,
        cell: ({ row }) => (
          <span className={`text-xs ${row.original.asignado ? 'text-slate-300' : 'text-slate-500 italic'}`}>
            {row.original.asignado?.nombre ?? 'Sin asignar'}
          </span>
        ),
      },
      {
        accessorKey: 'fecha_creacion',
        header: 'Fecha',
        size: 110,
        cell: ({ getValue }) => (
          <span className="text-xs text-slate-400">
            {new Date(getValue<string>()).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
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
            onClick={() => navigate(`/tickets/${row.original.id}`)}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [navigate]
  );

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-sm font-medium">Cargando tickets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Tickets</h1>
          <p className="text-sm text-slate-400 mt-1">{tickets.length} tickets en total</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nuevo Ticket
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar por título, solicitante, ubicación..."
            className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>

        {/* Estado filter pills */}
        <div className="flex items-center gap-1 bg-slate-900/60 rounded-xl border border-slate-800/80 p-1">
          <Filter className="h-4 w-4 text-slate-500 mx-2 shrink-0" />
          {ESTADOS_FILTER.map((estado) => (
            <button
              key={estado}
              onClick={() => setEstadoFilter(estado)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                estadoFilter === estado
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              {estado === 'TODOS' ? 'Todos' : estado}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
        {table.getRowModel().rows.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-500">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-slate-600" />
            <p className="font-medium">No se encontraron tickets</p>
            <p className="text-xs mt-1">Intenta cambiar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-slate-800/80">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-slate-300 transition' : ''}`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <>
                                {header.column.getIsSorted() === 'asc' ? (
                                  <ArrowUp className="h-3 w-3 text-blue-400" />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ArrowDown className="h-3 w-3 text-blue-400" />
                                ) : (
                                  <ArrowUpDown className="h-3 w-3 text-slate-600" />
                                )}
                              </>
                            )}
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tickets/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3" style={{ width: cell.column.getSize() }}>
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
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/80">
            <span className="text-xs text-slate-500">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} — {table.getFilteredRowModel().rows.length} registros
            </span>
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

      {/* Modal de Crear Ticket */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(id) => navigate(`/tickets/${id}`)}
      />
    </div>
  );
};

export default TicketList;
