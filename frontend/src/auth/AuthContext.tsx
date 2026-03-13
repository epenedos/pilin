import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth.api';
import { setAccessToken } from './tokenManager';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.refresh()
      .then(({ accessToken }) => {
        setAccessToken(accessToken);
        // Decode user from token
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        setUser({ id: payload.sub, email: payload.email, displayName: '' });
      })
      .catch(() => {
        setAccessToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken, user } = await authApi.login(email, password);
    setAccessToken(accessToken);
    setUser(user);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const { accessToken, user } = await authApi.register(email, password, displayName);
    setAccessToken(accessToken);
    setUser(user);
  };

  const logout = async () => {
    await authApi.logout();
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
