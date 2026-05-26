import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  role: 'master' | 'table_1' | 'table_2' | 'table_3' | 'table_4' | 'table_5';
  label: string;
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Intentar cargar la sesión actual en el arranque (usando token de sessionStorage o cookies)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/auth/me', { headers });
        if (response.ok) {
          const data = await response.json();
          setUser({ role: data.role, label: data.label });
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error al recuperar sesión activa:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (password: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Credencial incorrecta.');
        return false;
      }

      const data = await response.json();
      
      // Guardar token en sessionStorage para soporte de pestañas en incógnito que bloqueen cookies
      if (data.success && data.token) {
        sessionStorage.setItem('token', data.token);
      }
      
      setUser({ role: data.role, label: data.label });
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setError('Error de conexión con el servidor.');
      return false;
    }
  };

  const logout = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch('/api/auth/logout', { method: 'POST', headers });
    } catch (err) {
      console.error('Error al desloguearse:', err);
    } finally {
      sessionStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};
