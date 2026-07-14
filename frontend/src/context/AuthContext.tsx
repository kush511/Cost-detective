import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { AUTH_STORAGE_EVENT, clearSession, getStoredToken, getStoredUser, setSession } from '../utils/auth';
import type { AuthUser } from '../types';
import type { ReactNode } from 'react';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readSession() {
  return {
    token: getStoredToken(),
    user: getStoredUser(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readSession().token);
  const [user, setUser] = useState<AuthUser | null>(() => readSession().user);

  useEffect(() => {
    const syncSession = () => {
      const nextSession = readSession();
      setToken(nextSession.token);
      setUser(nextSession.user);
    };

    syncSession();

    window.addEventListener('storage', syncSession);
    window.addEventListener(AUTH_STORAGE_EVENT, syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener(AUTH_STORAGE_EVENT, syncSession);
    };
  }, []);

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    setSession(response.data.token, response.data.user);
    setToken(response.data.token);
    setUser(response.data.user);
  }

  async function signup(email: string, password: string) {
    const response = await api.post('/auth/signup', { email, password });
    setSession(response.data.token, response.data.user);
    setToken(response.data.token);
    setUser(response.data.user);
  }

  function logout() {
    clearSession();
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ token, user, isAuthenticated: Boolean(token), login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}