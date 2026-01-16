// src/types/auth.types.ts
export interface User {
  userId: string;  // ← Dùng userId
  username: string;
  email?: string;
  role?: string;
  permissions?: string[];
  fullName?: string;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (userData: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loading: boolean;
  getAccessToken: () => Promise<string | null>; 
  getRefreshToken: () => string | null;
}


export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData extends LoginFormData {
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;  // ← Dùng userId
  username: string;
  email?: string;
  role?: string;
  permissions?: string[];
  fullName?: string;
  avatar?: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
  username: string;
  email?: string;
  role?: string;
  permissions?: string[];
}
