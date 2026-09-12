import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { AuthContextType, Usuario } from '../types';
import { authService } from '../services';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'ncp_token';
const USER_KEY = 'ncp_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<Usuario | null>(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      try {
        return JSON.parse(savedUser) as Usuario;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Verificar sesión existente al cargar la aplicación
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authService.getMe();
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      } catch {
        // Token inválido o expirado
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Escuchar eventos de sesión expirada emitidos por el interceptor de Axios
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const loginWithGoogleToken = async (googleToken: string) => {
    setIsLoading(true);
    try {
      const tokenResponse = await authService.loginWithGoogle(googleToken);
      localStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
      setToken(tokenResponse.access_token);

      const userData = await authService.getMe();
      setUser(userData);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };



  const updateUser = useCallback((updatedUser: Usuario) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  const isSoporteOrAdmin = useMemo(() => {
    if (!user) return false;
    return user.rol === 'Soporte' || user.rol === 'Administrador';
  }, [user]);

  const needsProfileCompletion = useMemo(() => {
    if (!user) return false;
    return user.cargo === 'Sin asignar' || user.area === 'Sin asignar';
  }, [user]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    isSoporteOrAdmin,
    needsProfileCompletion,
    loginWithGoogleToken,
    updateUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
