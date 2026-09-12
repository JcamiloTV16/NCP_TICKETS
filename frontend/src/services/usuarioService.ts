import api from './api';
import type { Usuario, UsuarioUpdate } from '../types';

export const usuarioService = {
  getUsuarios: async (): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>('/usuarios');
    return data;
  },

  updateUsuario: async (userId: number, payload: UsuarioUpdate): Promise<Usuario> => {
    const { data } = await api.patch<Usuario>(`/usuarios/${userId}`, payload);
    return data;
  },
};
