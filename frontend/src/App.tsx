import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes/AppRoutes';

// Cliente de React Query configurado con buenas prácticas para datos de tickets
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos de frescura
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
