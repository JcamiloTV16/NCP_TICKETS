import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// URL base de la API - Permite variable de entorno VITE_API_BASE_URL o fallback al proxy de Vite '/api/v1'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor de Request: adjuntar JWT si existe
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('ncp_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Response: Manejo global de 401 y normalización de errores de FastAPI
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | { msg: string }[] }>) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('ncp_token');
      localStorage.removeItem('ncp_user');
      
      // Si no estamos en login, notificar o redirigir
      if (!window.location.pathname.includes('/login')) {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    // Extraer mensaje amigable desde FastAPI
    let errorMessage = 'Ocurrió un error inesperado en el servidor';
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((d) => d.msg).join(', ');
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
