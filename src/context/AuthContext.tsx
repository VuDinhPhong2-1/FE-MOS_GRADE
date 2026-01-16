import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { User, AuthContextType } from '../types/auth.types';

interface JwtPayload { exp: number; [key: string]: any }

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps { children: ReactNode; }

// --- Hàm kiểm tra accessToken hết hạn chưa ---
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    if (!exp) return true;
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// --- Hàm dùng refreshToken để lấy lại accessToken mới ---
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const res = await fetch('https://localhost:7223/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch (err) {
    return null;
  }
};

// --- Hàm luôn trả về accessToken hợp lệ (refresh nếu cần) ---
const getValidAccessToken = async (): Promise<string | null> => {
  let accessToken = localStorage.getItem('accessToken');
  if (isTokenExpired(accessToken)) {
    accessToken = await refreshAccessToken();
  }
  return accessToken;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const savedUser = localStorage.getItem('user');
    if (accessToken && refreshToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User, accessToken: string, refreshToken: string): void => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = (): void => {
    localStorage.clear();
    setUser(null);
  };


  const getAccessToken = (): Promise<string | null> => getValidAccessToken();

  const getRefreshToken = (): string | null => localStorage.getItem('refreshToken');

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
