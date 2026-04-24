import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api, setToken, getToken } from '../lib/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user } = await api.get<{ user: User }>('/auth/me');
      setUser(user);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function hydrateFromToken() {
    const { user } = await api.get<{ user: User }>('/auth/me');
    if (!user) throw new Error('Login succeeded but no profile was returned');
    setUser(user);
  }

  async function login(email: string, password: string) {
    const res = await api.post<{ user: User | null; access_token: string }>(
      '/auth/login',
      { email, password }
    );
    setToken(res.access_token);
    if (res.user) setUser(res.user);
    else await hydrateFromToken();
  }

  async function signup(email: string, password: string, full_name?: string) {
    const res = await api.post<{ user: User | null; access_token: string }>(
      '/auth/signup',
      { email, password, full_name }
    );
    setToken(res.access_token);
    if (res.user) setUser(res.user);
    else await hydrateFromToken();
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
