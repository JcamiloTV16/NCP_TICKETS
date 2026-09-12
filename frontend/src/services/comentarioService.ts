import api from './api';
import type { Comentario, ComentarioCreate } from '../types';

export const comentarioService = {
  getComentarios: async (ticketId: number): Promise<Comentario[]> => {
    const { data } = await api.get<Comentario[]>(`/tickets/${ticketId}/comentarios`);
    return data;
  },

  addComentario: async (ticketId: number, payload: ComentarioCreate): Promise<Comentario> => {
    const { data } = await api.post<Comentario>(`/tickets/${ticketId}/comentarios`, payload);
    return data;
  },
};
