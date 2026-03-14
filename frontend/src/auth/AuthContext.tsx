import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth.api';
import { userApi } from '../api/user.api';
import { setAccessToken } from './tokenManager';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await userApi.getProfile();
      setUser(profile);
    } catch {
      // If profile fetch fails, user state remains unchanged
    }
  }, []);

  useEffect(() => {
    authApi.refresh()
      .then(async ({ accessToken }) => {
        setAccessToken(accessToken);
        // Fetch full user profile instead of just decoding JWT
        const profile = await userApi.getProfile();
        setUser(profile);
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
