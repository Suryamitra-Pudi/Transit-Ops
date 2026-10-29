'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getStoredUser, getToken, saveSession, clearSession } from '@/lib/auth';
import { User } from '@/types';

export function useAuth({ redirectIfUnauthenticated = true } = {}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      setLoading(false);
      if (redirectIfUnauthenticated) router.replace('/login');
      return;
    }
    setUser(stored);
    setLoading(false);
  }, [redirectIfUnauthenticated, router]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    saveSession(res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data.user as User;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.push('/login');
  }, [router]);

  return { user, loading, login, logout };
}
