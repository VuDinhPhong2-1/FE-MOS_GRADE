/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { AuthContextType, User } from '../types/auth.types';
import { AUTH_API_BASE_URL } from '../config/api';

interface JwtPayload {
  exp?: number;
}

interface AuthProviderProps {
  children: ReactNode;
}

const REFRESH_EARLY_MS = 5 * 60 * 1000;
const REFRESH_LOCK_KEY = 'auth_refresh_lock';
const REFRESH_BROADCAST_KEY = 'auth_refresh_broadcast';
const REFRESH_LOCK_TTL_MS = 12_000;
const REFRESH_WAIT_TIMEOUT_MS = 12_500;
const REFRESH_WAIT_INTERVAL_MS = 250;
const REFRESH_MAX_ATTEMPTS = 2;

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
  const tabIdRef = useRef<string>(
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

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

  const isAccessTokenUsable = (token: string | null): token is string =>
    Boolean(token) && !isTokenExpired(token);

  const readRefreshLock = (): { owner: string; expiresAt: number } | null => {
    const raw = localStorage.getItem(REFRESH_LOCK_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as { owner?: unknown; expiresAt?: unknown };
      if (typeof parsed.owner !== 'string' || typeof parsed.expiresAt !== 'number') {
        return null;
      }
      return { owner: parsed.owner, expiresAt: parsed.expiresAt };
    } catch {
      return null;
    }
  };

  const tryAcquireRefreshLock = (): boolean => {
    const now = Date.now();
    const currentLock = readRefreshLock();
    if (currentLock && currentLock.owner !== tabIdRef.current && currentLock.expiresAt > now) {
      return false;
    }

    const newLock = JSON.stringify({
      owner: tabIdRef.current,
      expiresAt: now + REFRESH_LOCK_TTL_MS,
    });

    localStorage.setItem(REFRESH_LOCK_KEY, newLock);
    const confirmedLock = readRefreshLock();
    return confirmedLock?.owner === tabIdRef.current;
  };

  const releaseRefreshLock = () => {
    const currentLock = readRefreshLock();
    if (currentLock?.owner === tabIdRef.current) {
      localStorage.removeItem(REFRESH_LOCK_KEY);
    }
  };

  const broadcastRefreshSuccess = () => {
    localStorage.setItem(
      REFRESH_BROADCAST_KEY,
      JSON.stringify({ at: Date.now(), by: tabIdRef.current })
    );
  };

  const waitForAnotherTabRefresh = async (
    previousRefreshToken: string | null
  ): Promise<string | null> => {
    const nowUsableToken = localStorage.getItem('accessToken');
    const nowRefreshToken = localStorage.getItem('refreshToken');
    if (
      isAccessTokenUsable(nowUsableToken) &&
      nowRefreshToken &&
      nowRefreshToken !== previousRefreshToken
    ) {
      return nowUsableToken;
    }

    return new Promise((resolve) => {
      const startedAt = Date.now();
      let intervalId: number | null = null;

      const finish = (token: string | null) => {
        window.removeEventListener('storage', onStorage);
        if (intervalId !== null) {
          window.clearInterval(intervalId);
        }
        resolve(token);
      };

      const tryResolveFromStorage = () => {
        const latestAccessToken = localStorage.getItem('accessToken');
        const latestRefreshToken = localStorage.getItem('refreshToken');
        if (
          isAccessTokenUsable(latestAccessToken) &&
          latestRefreshToken &&
          latestRefreshToken !== previousRefreshToken
        ) {
          finish(latestAccessToken);
          return;
        }

        if (Date.now() - startedAt >= REFRESH_WAIT_TIMEOUT_MS) {
          finish(null);
        }
      };

      const onStorage = (event: StorageEvent) => {
        if (
          event.key === 'accessToken' ||
          event.key === 'refreshToken' ||
          event.key === REFRESH_BROADCAST_KEY ||
          event.key === REFRESH_LOCK_KEY
        ) {
          tryResolveFromStorage();
        }
      };

      window.addEventListener('storage', onStorage);
      intervalId = window.setInterval(tryResolveFromStorage, REFRESH_WAIT_INTERVAL_MS);
      tryResolveFromStorage();
    });
  };

  const callRefreshEndpoint = async (
    refreshToken: string
  ): Promise<
    | { type: 'success'; accessToken: string; refreshToken: string }
    | { type: 'unauthorized' }
    | { type: 'error' }
  > => {
    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.status === 401) {
        return { type: 'unauthorized' };
      }

      if (!response.ok) {
        console.warn('Refresh token API error:', response.status, response.statusText);
        return { type: 'error' };
      }

      const data = await response.json();
      if (!data?.accessToken || !data?.refreshToken) {
        console.warn('Invalid refresh token response: missing accessToken or refreshToken');
        return { type: 'error' };
      }

      return {
        type: 'success',
        accessToken: data.accessToken as string,
        refreshToken: data.refreshToken as string,
      };
    } catch (error) {
      console.warn(
        'Network error when refreshing token:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return { type: 'error' };
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      const currentAccessToken = localStorage.getItem('accessToken');
      if (isAccessTokenUsable(currentAccessToken)) {
        scheduleProactiveRefresh(currentAccessToken);
        return currentAccessToken;
      }

      if (!localStorage.getItem('refreshToken')) {
        clearSession();
        setUser(null);
        return null;
      }

      for (let attempt = 0; attempt < REFRESH_MAX_ATTEMPTS; attempt += 1) {
        const previousRefreshToken = localStorage.getItem('refreshToken');
        if (!previousRefreshToken) {
          clearSession();
          setUser(null);
          return null;
        }

        if (!tryAcquireRefreshLock()) {
          const tokenFromOtherTab = await waitForAnotherTabRefresh(previousRefreshToken);
          if (tokenFromOtherTab) {
            scheduleProactiveRefresh(tokenFromOtherTab);
            return tokenFromOtherTab;
          }

          continue;
        }

        try {
          const latestRefreshToken = localStorage.getItem('refreshToken');
          if (!latestRefreshToken) {
            clearSession();
            setUser(null);
            return null;
          }

          const refreshResult = await callRefreshEndpoint(latestRefreshToken);
          if (refreshResult.type === 'success') {
            localStorage.setItem('accessToken', refreshResult.accessToken);
            localStorage.setItem('refreshToken', refreshResult.refreshToken);
            broadcastRefreshSuccess();
            scheduleProactiveRefresh(refreshResult.accessToken);
            return refreshResult.accessToken;
          }

          if (refreshResult.type === 'unauthorized') {
            const tokenFromOtherTab = await waitForAnotherTabRefresh(previousRefreshToken);
            if (tokenFromOtherTab) {
              scheduleProactiveRefresh(tokenFromOtherTab);
              return tokenFromOtherTab;
            }

            if (attempt === REFRESH_MAX_ATTEMPTS - 1) {
              clearSession();
              setUser(null);
              return null;
            }
          } else {
            return null;
          }
        } finally {
          releaseRefreshLock();
        }
      }

      return null;
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

  const updateUser = (userData: Partial<User>): void => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      const nextUser = { ...prevUser, ...userData };
      localStorage.setItem('user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const logout = () => {
    const accessToken = localStorage.getItem('accessToken');
    clearSession();
    setUser(null);

    void fetch(`${AUTH_API_BASE_URL}/logout`, {
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
      let refreshFailed = false;
      
      if (!token || isTokenExpired(token)) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          token = refreshedToken;
        } else {
          // ✅ Refresh thất bại → đừng gọi /me vì token đã expire
          // Giữ session, user sẽ được refresh token lại ở lần request tiếp theo
          console.warn('Failed to refresh access token on init, keeping session for next request');
          refreshFailed = true;
          // Không lấy lại accessToken cũ vì nó đã expire
          token = null;
        }
      }

      scheduleProactiveRefresh(token);

      // ✅ Chỉ gọi /me nếu có token hợp lệ (refresh thành công hoặc token chưa expire)
      if (!refreshFailed) {
        try {
          const headers: HeadersInit = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const meResponse = await fetch(`${AUTH_API_BASE_URL}/me`, {
            method: 'GET',
            headers,
          });

          // ✅ Chỉ logout khi server xác nhận token không hợp lệ (401)
          if (meResponse.status === 401) {
            clearSession();
            if (mounted) setUser(null);
          }
          // Các lỗi khác (500, 503, network...) → giữ session, không logout
        } catch {
          // ✅ Lỗi mạng → KHÔNG logout, giữ nguyên session
          console.warn('Không thể kết nối server khi khởi tạo session, giữ session hiện tại.');
        }
      }

      if (mounted) setLoading(false);
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
    <AuthContext.Provider
      value={{ user, login, updateUser, logout, loading, getAccessToken, getRefreshToken }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
