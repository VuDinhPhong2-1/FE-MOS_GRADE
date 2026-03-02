/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { AuthContextType, User } from '../types/auth.types';

interface JwtPayload {
  exp?: number;
}

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = 'https://localhost:7223/api/auth';
const REFRESH_EARLY_MS = 5 * 60 * 1000;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getTokenExpiryMs = (token: string | null): number | null => {
  if (!token) return null;

  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    return exp ? exp * 1000 : null;
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string | null): boolean => {
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return true;
  return expiryMs <= Date.now();
};

const clearSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const getInitialUser = (): User | null => {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser) as User;
  } catch {
    clearSession();
    return null;
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => getInitialUser());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const proactiveTimerRef = useRef<number | null>(null);

  const scheduleProactiveRefresh = (token: string | null) => {
    if (proactiveTimerRef.current) {
      window.clearTimeout(proactiveTimerRef.current);
      proactiveTimerRef.current = null;
    }

    const expiryMs = getTokenExpiryMs(token);
    if (!expiryMs) return;

    const delay = Math.max(0, expiryMs - Date.now() - REFRESH_EARLY_MS);
    proactiveTimerRef.current = window.setTimeout(() => {
      void getAccessToken(true);
    }, delay);
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        clearSession();
        setUser(null);
        return null;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          clearSession();
          setUser(null);
          return null;
        }

        const data = await response.json();
        if (!data?.accessToken || !data?.refreshToken) {
          clearSession();
          setUser(null);
          return null;
        }

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        scheduleProactiveRefresh(data.accessToken);

        return data.accessToken;
      } catch {
        clearSession();
        setUser(null);
        return null;
      }
    })();

    try {
      return await refreshPromiseRef.current;
    } finally {
      refreshPromiseRef.current = null;
    }
  };

  const getAccessToken = async (forceRefresh = false): Promise<string | null> => {
    const accessToken = localStorage.getItem('accessToken');

    if (!forceRefresh && accessToken && !isTokenExpired(accessToken)) {
      return accessToken;
    }

    return refreshAccessToken();
  };

  const getRefreshToken = (): string | null => localStorage.getItem('refreshToken');

  const login = (userData: User, accessToken: string, refreshToken: string): void => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    scheduleProactiveRefresh(accessToken);
  };

  const logout = () => {
    const accessToken = localStorage.getItem('accessToken');
    clearSession();
    setUser(null);

    void fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    }).finally(() => {
      if (proactiveTimerRef.current) {
        window.clearTimeout(proactiveTimerRef.current);
        proactiveTimerRef.current = null;
      }
    });
  };

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      const savedUser = getInitialUser();
      const refreshToken = localStorage.getItem('refreshToken');
      if (!savedUser || !refreshToken) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      setUser(savedUser);

      let token = localStorage.getItem('accessToken');
      if (!token || isTokenExpired(token)) {
        token = await refreshAccessToken();
      }

      if (!token) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      scheduleProactiveRefresh(token);

      try {
        const meResponse = await fetch(`${API_BASE_URL}/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!meResponse.ok && meResponse.status !== 404) {
          clearSession();
          if (mounted) setUser(null);
        }
      } catch {
        clearSession();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void initializeSession();

    return () => {
      mounted = false;
      if (proactiveTimerRef.current) {
        window.clearTimeout(proactiveTimerRef.current);
        proactiveTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, getAccessToken, getRefreshToken }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
