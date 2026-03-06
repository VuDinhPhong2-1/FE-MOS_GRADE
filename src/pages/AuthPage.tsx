import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import type { LoginFormData, LoginResponse, RegisterFormData } from '../types/auth.types';
import { AUTH_API_BASE_URL } from '../config/api';

export default function AuthPage() {
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    email: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const parseErrorMessage = async (response: Response): Promise<string> => {
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorData = await response.json();
        if (errorData?.message) return String(errorData.message);
      } else {
        const text = await response.text();
        if (text) return text;
      }
    } catch {
      // ignore
    }

    return 'Có lỗi xảy ra';
  };

  const handleAuthSuccess = (data: LoginResponse) => {
    if (!data.accessToken || !data.refreshToken) {
      throw new Error('Máy chủ không trả về token');
    }

    login(
      {
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
        fullName: data.fullName,
        avatar: data.avatar,
        permissions: data.permissions,
      },
      data.accessToken,
      data.refreshToken
    );

    navigate('/dashboard');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? `${AUTH_API_BASE_URL}/login` : `${AUTH_API_BASE_URL}/register`;

    try {
      const body: LoginFormData | RegisterFormData = isLogin
        ? { username: formData.username, password: formData.password }
        : formData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      if (isLogin) {
        const data: LoginResponse = await response.json();
        handleAuthSuccess(data);
      } else {
        await response.json().catch(() => null);
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLogin(true);
        setFormData({ username: '', password: '', email: '' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError('');
      const idToken = credentialResponse.credential;
      if (!idToken) {
        throw new Error('Không lấy được Google idToken');
      }

      const response = await fetch(`${AUTH_API_BASE_URL}/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const data: LoginResponse = await response.json();
      handleAuthSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md p-5 sm:p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}
        </h2>

        {error && (
          <div className="mb-4 p-3 text-red-700 bg-red-100 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="flex items-center border rounded px-3 py-2 focus-within:border-blue-500">
              <Mail size={20} className="text-gray-400 mr-2" />
              <input
                type="email"
                name="email"
                placeholder="Thư điện tử"
                required
                className="w-full outline-none"
                onChange={handleChange}
                value={formData.email}
              />
            </div>
          )}

          <div className="flex items-center border rounded px-3 py-2 focus-within:border-blue-500">
            <User size={20} className="text-gray-400 mr-2" />
            <input
              type="text"
              name="username"
              placeholder="Tên đăng nhập"
              required
              className="w-full outline-none"
              onChange={handleChange}
              value={formData.username}
            />
          </div>

          <div className="flex items-center border rounded px-3 py-2 focus-within:border-blue-500">
            <Lock size={20} className="text-gray-400 mr-2" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Mật khẩu"
              required
              className="w-full outline-none"
              onChange={handleChange}
              value={formData.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="ml-2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium"
          >
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>

          {isLogin && hasGoogleClientId && (
            <>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Hoặc</span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleLoginSuccess}
                  onError={() => setError('Đăng nhập Google thất bại')}
                  useOneTap={false}
                />
              </div>
            </>
          )}

          {isLogin && !hasGoogleClientId && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              Đăng nhập Google chưa được cấu hình. Đặt biến `VITE_GOOGLE_CLIENT_ID` trong file `.env`.
            </div>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
          <span
            className="text-blue-600 cursor-pointer ml-1 font-semibold hover:underline"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setShowPassword(false);
            }}
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </span>
        </p>
      </div>
    </div>
  );
}
