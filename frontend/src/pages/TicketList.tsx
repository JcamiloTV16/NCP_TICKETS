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
  Creado: { bg: 'bg-rose-500/10 border-rose-500/25', text: 'text-rose-400', dot: 'bg-rose-400' },
  'En Ejecución': { bg: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-400', dot: 'bg-amber-400' },
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
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 text-slate-400 shrink-0">
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
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text}`}
            >
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
            onClick={() => navigate(`/tickets/${row.original.id}`)}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition cursor-pointer"
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
    initialState: { pagination: { pageSize: 10 } },
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

  const pagination = table.getState().pagination;
  const pageIndex = pagination.pageIndex;
  const pageSize = pagination.pageSize;
  const totalFilteredRows = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();

  const startRow = totalFilteredRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalFilteredRows);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 lg:p-6 space-y-4 max-w-full w-full mx-auto">
      {/* Encabezado Fijo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Tickets</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {tickets.length} {tickets.length === 1 ? 'ticket registrado' : 'tickets en total'}
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Nuevo Ticket
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda Fija */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar por título, solicitante, ubicación..."
            className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>

        {/* Filtros rápidos por estado */}
        <div className="flex items-center gap-1 bg-slate-900/80 rounded-xl border border-slate-800/80 p-1 overflow-x-auto">
          <Filter className="h-3.5 w-3.5 text-slate-500 mx-2 shrink-0" />
          {ESTADOS_FILTER.map((estado) => (
            <button
              key={estado}
              onClick={() => setEstadoFilter(estado)}
              className={`rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                estadoFilter === estado
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              {estado === 'TODOS' ? 'Todos' : estado}
            </button>
          ))}
        </div>
      </div>

      {/* Card de la Tabla con Scroll Interno y Cabecera 'Sticky' */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 flex-1 min-h-0 flex flex-col overflow-hidden shadow-xl">
        {table.getRowModel().rows.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-sm text-slate-500">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-slate-600" />
            <p className="font-medium text-slate-300">No se encontraron tickets</p>
            <p className="text-xs mt-1 text-slate-500">Intenta cambiar los filtros de búsqueda</p>
          </div>
        ) : (
          /* Área scrollable interna únicamente para las filas */
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 shadow-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/95 select-none"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            className={`flex items-center gap-1 ${
                              header.column.getCanSort()
                                ? 'cursor-pointer select-none hover:text-slate-200 transition'
                                : ''
                            }`}
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
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
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

        {/* Barra de Vistas y Paginación (Siempre visible al pie de la tabla) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-800/80 bg-slate-900/90 shrink-0 select-none">
          {/* Lado izquierdo: Selector de tamaño de vista + Contador de registros */}
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Ver por página:</span>
              <select
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="rounded-lg border border-slate-700/80 bg-slate-800/90 px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500 transition cursor-pointer"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} tickets
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-700 hidden sm:inline">•</span>

            <span>
              Mostrando{' '}
              <strong className="text-slate-200 font-semibold">{startRow}</strong> -{' '}
              <strong className="text-slate-200 font-semibold">{endRow}</strong> de{' '}
              <strong className="text-slate-200 font-semibold">{totalFilteredRows}</strong> tickets
            </span>
          </div>

          {/* Lado derecho: Botones de navegación de vistas / páginas */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 mr-2 hidden md:inline">
              Página <strong className="text-slate-200">{pageCount === 0 ? 0 : pageIndex + 1}</strong> de{' '}
              <strong className="text-slate-200">{pageCount}</strong>
            </span>

            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Números de página interactivos */}
            {Array.from({ length: pageCount }, (_, i) => i)
              .filter((i) => Math.abs(i - pageIndex) <= 1 || i === 0 || i === pageCount - 1)
              .map((i, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev !== undefined && i - prev > 1;
                return (
                  <React.Fragment key={i}>
                    {showEllipsis && <span className="px-1 text-slate-600 text-xs">...</span>}
                    <button
                      onClick={() => table.setPageIndex(i)}
                      className={`h-7 min-w-[28px] px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        pageIndex === i
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
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
