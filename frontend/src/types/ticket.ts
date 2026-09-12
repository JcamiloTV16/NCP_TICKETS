import type { Usuario } from './usuario';

export type EstadoTicket = 'Creado' | 'En Ejecución' | 'Solucionado';

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  tipo_caso: string;
  estado: EstadoTicket;
  usuario_id: number;
  asignado_a: number | null;
  fecha_creacion: string;
  fecha_modificacion: string;
  fecha_solucion: string | null;
  usuario: Usuario;
  asignado: Usuario | null;
}

export interface TicketListItem {
  id: number;
  titulo: string;
  ubicacion: string;
  tipo_caso: string;
  estado: EstadoTicket;
  fecha_creacion: string;
  fecha_modificacion: string;
  fecha_solucion: string | null;
  usuario: Usuario;
  asignado: Usuario | null;
}

export interface TicketCreate {
  titulo: string;
  descripcion: string;
  ubicacion: string;
  tipo_caso: string;
  usuario_id?: number;
  asignado_a?: number | null;
}

export interface TicketUpdate {
  titulo?: string;
  descripcion?: string;
  ubicacion?: string;
  tipo_caso?: string;
  estado?: EstadoTicket;
  asignado_a?: number | null;
}

export interface TicketFilterParams {
  estado?: EstadoTicket | 'TODOS';
  tipo_caso?: string;
  busqueda?: string;
}

export interface DashboardMetrics {
  total: number;
  creados: number;
  enEjecucion: number;
  solucionados: number;
}
