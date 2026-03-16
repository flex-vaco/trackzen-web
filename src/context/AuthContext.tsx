import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (orgName: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem('accessToken'),
  );
  const [isLoading, setIsLoading] = useState(true);

  const storeToken = useCallback((token: string) => {
    localStorage.setItem('accessToken', token);
    setAccessToken(token);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
    setUser(null);
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const res = await authService.refreshToken();
      storeToken(res.data.accessToken);
      setUser(res.data.user);
    } catch {
      clearAuth();
    }
  }, [storeToken, clearAuth]);

  // On mount, try to restore session via refresh
  useEffect(() => {
    refreshToken().finally(() => setIsLoading(false));
  }, [refreshToken]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    storeToken(res.data.accessToken);
    setUser(res.data.user);
  }, [storeToken]);

  const register = useCallback(async (orgName: string, name: string, email: string, password: string) => {
    const res = await authService.register(orgName, name, email, password);
    storeToken(res.data.accessToken);
    setUser(res.data.user);
  }, [storeToken]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value: AuthContextValue = {
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
