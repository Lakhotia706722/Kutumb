'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, AuthState, User, FamilyInfo } from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  family: FamilyInfo | null;
  role: 'owner' | 'member' | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [role, setRole] = useState<'owner' | 'member' | null>(null);
  const [loading, setLoading] = useState(true);

  const applyState = (state: AuthState) => {
    setUser(state.user);
    setFamily(state.family);
    setRole(state.role);
  };

  const clearState = () => {
    setUser(null);
    setFamily(null);
    setRole(null);
  };

  const refresh = useCallback(async () => {
    try {
      const res = await authApi.me();
      applyState(res.data);
    } catch (err) {
      // Only clear state on auth error, not network errors
      if (err instanceof Error && err.message.includes('session')) {
        clearState();
      } else {
        // Network error or other issue — don't clear, let user retry
        console.warn('Auth refresh failed:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    applyState(res.data);
  };

  const logout = async () => {
    await authApi.logout();
    clearState();
  };

  return (
    <AuthContext.Provider value={{ user, family, role, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
