import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usuarioService } from '../services';
import type { Usuario, RolUsuario } from '../types';
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
  Loader2,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  X,
  Check,
  Shield,
} from 'lucide-react';

const ROLES: RolUsuario[] = ['Usuario', 'Soporte', 'Administrador'];

const rolBadge: Record<string, { bg: string; text: string }> = {
  Usuario: { bg: 'bg-slate-500/10 border-slate-500/25', text: 'text-slate-400' },
  Soporte: { bg: 'bg-blue-500/10 border-blue-500/25', text: 'text-blue-400' },
  Administrador: { bg: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-400' },
};

export const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre', desc: false }]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ rol: RolUsuario; cargo: string; area: string }>({
    rol: 'Usuario',
    cargo: '',
    area: '',
  });

  const { data: usuarios = [], isLoading } = useQuery<Usuario[]>({
    queryKey: ['usuarios'],
    queryFn: () => usuarioService.getUsuarios(),
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: number; data: { rol?: RolUsuario; cargo?: string; area?: string } }) =>
      usuarioService.updateUsuario(params.id, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setEditingId(null);
    },
  });

  const startEdit = (u: Usuario) => {
    setEditingId(u.id);
    setEditForm({ rol: u.rol, cargo: u.cargo ?? '', area: u.area ?? '' });
  };

  const saveEdit = () => {
    if (editingId === null) return;
    updateMutation.mutate({
      id: editingId,
      data: { rol: editForm.rol, cargo: editForm.cargo, area: editForm.area },
    });
  };

  const columns = useMemo<ColumnDef<Usuario>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 60,
        cell: ({ getValue }) => <span className="font-mono text-xs text-slate-500">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        size: 180,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400 text-xs font-bold">
                {u.nombre.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-200 truncate">{u.nombre}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 240,
        cell: ({ getValue }) => <span className="text-xs text-slate-400 truncate">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'rol',
        header: 'Rol',
        size: 150,
        cell: ({ row }) => {
          const u = row.original;
          if (editingId === u.id) {
            return (
              <select
                value={editForm.rol}
                onChange={(e) => setEditForm((prev) => ({ ...prev, rol: e.target.value as RolUsuario }))}
                className="rounded-lg border border-slate-700/80 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500/60"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            );
          }
          const rb = rolBadge[u.rol] || rolBadge.Usuario;
          return (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${rb.bg} ${rb.text}`}>
              <Shield className="h-3 w-3" />
              {u.rol}
            </span>
          );
        },
      },
      {
        accessorKey: 'cargo',
        header: 'Cargo',
        size: 160,
        cell: ({ row }) => {
          const u = row.original;
          if (editingId === u.id) {
            return (
              <input
                value={editForm.cargo}
                onChange={(e) => setEditForm((prev) => ({ ...prev, cargo: e.target.value }))}
                className="w-full rounded-lg border border-slate-700/80 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500/60"
                placeholder="Cargo..."
              />
            );
          }
          return <span className="text-xs text-slate-400">{u.cargo || '—'}</span>;
        },
      },
      {
        accessorKey: 'area',
        header: 'Área',
        size: 160,
        cell: ({ row }) => {
          const u = row.original;
          if (editingId === u.id) {
            return (
              <input
                value={editForm.area}
                onChange={(e) => setEditForm((prev) => ({ ...prev, area: e.target.value }))}
                className="w-full rounded-lg border border-slate-700/80 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500/60"
                placeholder="Área..."
              />
            );
          }
          return <span className="text-xs text-slate-400">{u.area || '—'}</span>;
        },
      },
      {
        id: 'acciones',
        header: '',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original;
          if (editingId === u.id) {
            return (
              <div className="flex items-center gap-1">
                <button
                  onClick={saveEdit}
                  disabled={updateMutation.isPending}
                  className="flex items-center justify-center h-7 w-7 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition"
                  title="Guardar"
                >
                  {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Cancelar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          }
          return (
            <button
              onClick={() => startEdit(u)}
              className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          );
        },
      },
    ],
    [editingId, editForm, updateMutation.isPending]
  );

  const table = useReactTable({
    data: usuarios,
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
          <span className="text-sm font-medium">Cargando usuarios...</span>
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
      {/* Header Fijo */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Usuarios</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          {usuarios.length} {usuarios.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
        </p>
      </div>

      {/* Buscador Fijo */}
      <div className="relative max-w-md shrink-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar por nombre, email, cargo..."
          className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      {/* Tabla con scroll interno y cabecera sticky */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 flex-1 min-h-0 flex flex-col overflow-hidden shadow-xl">
        {table.getRowModel().rows.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-sm text-slate-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-slate-600" />
            <p className="font-medium text-slate-300">No se encontraron usuarios</p>
            <p className="text-xs mt-1 text-slate-500">Intenta cambiar los términos de búsqueda</p>
          </div>
        ) : (
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
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
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

        {/* Barra de Paginación y Vistas */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-800/80 bg-slate-900/90 shrink-0 select-none">
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Ver por página:</span>
              <select
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="rounded-lg border border-slate-700/80 bg-slate-800/90 px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500 transition cursor-pointer"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} usuarios
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-700 hidden sm:inline">•</span>

            <span>
              Mostrando <strong className="text-slate-200 font-semibold">{startRow}</strong> -{' '}
              <strong className="text-slate-200 font-semibold">{endRow}</strong> de{' '}
              <strong className="text-slate-200 font-semibold">{totalFilteredRows}</strong> usuarios
            </span>
          </div>

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
    </div>
  );
};

export default UserManagement;
