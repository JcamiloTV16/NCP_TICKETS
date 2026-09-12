import type { Usuario } from './usuario';

export interface GoogleLoginRequest {
  google_token: string;
}

export interface DevLoginRequest {
  email: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  rol: string;
  exp: number;
}

export interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSoporteOrAdmin: boolean;
  needsProfileCompletion: boolean;
  loginWithGoogleToken: (googleToken: string) => Promise<void>;
  updateUser: (user: Usuario) => void;
  logout: () => void;
}
