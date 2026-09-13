import api from './api';
import type {
  Ticket,
  TicketCreate,
  TicketListItem,
  TicketUpdate,
  TicketCalificacionCreate,
  SupportAnalytics,
} from '../types';

export interface DashboardQueryParams {
  estado?: string;
  tipo_caso?: string;
}

export const ticketService = {
  getDashboardTickets: async (params?: DashboardQueryParams): Promise<TicketListItem[]> => {
    const cleanParams: Record<string, string> = {};
    if (params?.estado && params.estado !== 'TODOS') {
      cleanParams.estado = params.estado;
    }
    if (params?.tipo_caso) {
      cleanParams.tipo_caso = params.tipo_caso;
    }

    const { data } = await api.get<TicketListItem[]>('/tickets/dashboard', {
      params: cleanParams,
    });
    return data;
  },

  getMyTickets: async (): Promise<TicketListItem[]> => {
    const { data } = await api.get<TicketListItem[]>('/tickets');
    return data;
  },

  getTicketById: async (id: number): Promise<Ticket> => {
    const { data } = await api.get<Ticket>(`/tickets/${id}`);
    return data;
  },

  updateTicket: async (id: number, payload: TicketUpdate): Promise<Ticket> => {
    const { data } = await api.patch<Ticket>(`/tickets/${id}`, payload);
    return data;
  },

  createTicket: async (payload: TicketCreate): Promise<Ticket> => {
    const { data } = await api.post<Ticket>('/tickets', payload);
    return data;
  },

  calificarTicket: async (id: number, payload: TicketCalificacionCreate): Promise<Ticket> => {
    const { data } = await api.post<Ticket>(`/tickets/${id}/calificar`, payload);
    return data;
  },

  getSupportAnalytics: async (): Promise<SupportAnalytics> => {
    const { data } = await api.get<SupportAnalytics>('/tickets/analytics/support');
    return data;
  },
};
