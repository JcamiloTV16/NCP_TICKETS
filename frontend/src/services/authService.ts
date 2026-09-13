import api from './api';
import type { GoogleLoginRequest, TokenResponse, Usuario } from '../types';

export const authService = {
  loginWithGoogle: async (googleToken: string): Promise<TokenResponse> => {
    const payload: GoogleLoginRequest = { google_token: googleToken };
    const { data } = await api.post<TokenResponse>('/auth/google', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return data;
  },

  getMe: async (): Promise<Usuario> => {
    const { data } = await api.get<Usuario>('/auth/me');
    return data;
  },

  completeProfile: async (cargo: string, area: string): Promise<Usuario> => {
    const { data } = await api.patch<Usuario>('/auth/complete-profile', { cargo, area });
    return data;
  },
};
