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
  fecha_primera_respuesta: string | null;
  fecha_solucion: string | null;
  calificacion: number | null;
  comentario_calificacion: string | null;
  fecha_calificacion: string | null;
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
  fecha_primera_respuesta: string | null;
  fecha_solucion: string | null;
  calificacion: number | null;
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

export interface TicketCalificacionCreate {
  calificacion: number;
  comentario?: string;
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

export interface CategoriaTiempo {
  tipo_caso: string;
  promedio_solucion_minutos: number;
  promedio_respuesta_minutos: number;
  total_tickets: number;
}

export interface TestimonioSatisfaccion {
  ticket_id: number;
  titulo_ticket: string;
  usuario_nombre: string;
  calificacion: number;
  comentario: string | null;
  fecha: string;
}

export interface SupportAnalytics {
  tiempo_promedio_primera_respuesta_minutos: number;
  tiempo_promedio_solucion_minutos: number;
  tiempos_por_categoria: CategoriaTiempo[];
  promedio_satisfaccion: number;
  total_encuestas: number;
  distribucion_estrellas: Record<string, number>;
  porcentaje_satisfaccion: number;
  ultimos_testimonios: TestimonioSatisfaccion[];
}
