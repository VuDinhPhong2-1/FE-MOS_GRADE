import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import type { LoginFormData, LoginResponse, RegisterFormData } from '../types/auth.types';
import { AUTH_API_BASE_URL } from '../config/api';
import { notify } from '../utils/notify';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const isAuthBusy = isSubmitting || isGoogleSubmitting;
  const inputGroupClass =
    'flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-blue-400 focus-within:bg-blue-50/30 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]';
  const inputClass =
    'min-w-0 flex-1 border-0 bg-transparent px-0 py-3 text-sm text-slate-900 shadow-none outline-none placeholder:text-slate-400 focus:border-0 focus:shadow-none disabled:cursor-not-allowed disabled:text-slate-500';

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
        phoneNumber: data.phoneNumber,
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
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);
    let didNavigate = false;

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
        didNavigate = true;
      } else {
        await response.json().catch(() => null);
        notify.success('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLogin(true);
        setFormData({ username: '', password: '', email: '' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      if (!didNavigate) {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    if (isGoogleSubmitting) return;

    let didNavigate = false;
    try {
      setError('');
      setIsGoogleSubmitting(true);
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
      didNavigate = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại');
    } finally {
      if (!didNavigate) {
        setIsGoogleSubmitting(false);
      }
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(37,99,235,0.16),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.12),_transparent_45%)]" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_25px_60px_rgba(15,23,42,0.22)] lg:grid-cols-[1.1fr_1fr]">
        <div className="hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-10 text-white lg:block">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <ShieldCheck size={15} />
            MOS Grader Pro
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">Hệ thống quản lý và chấm điểm MOS</h1>
          <p className="mt-4 text-sm text-blue-100/90">
            Theo dõi lớp học, chấm điểm bài tập tự động và tổng hợp kết quả trực quan trong một giao diện
            thống nhất.
          </p>
          <div className="mt-10 space-y-3 text-sm text-blue-100/90">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Chấm điểm theo từng dự án và từng học sinh.</div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Xuất bảng điểm đẹp, rõ ràng, phục vụ báo cáo.</div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">Quản lý trường, lớp, học sinh tập trung.</div>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <h2 className="text-2xl font-extrabold text-slate-900">{isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}</h2>
          <p className="mt-1 text-sm text-slate-500">{isLogin ? 'Chào mừng bạn quay lại MOS Grader.' : 'Tạo tài khoản mới để bắt đầu sử dụng.'}</p>

          {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {!isLogin && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Thư điện tử</span>
                <div className={inputGroupClass}>
                  <Mail size={18} className="shrink-0 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    disabled={isAuthBusy}
                    className={inputClass}
                    onChange={handleChange}
                    value={formData.email}
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Tên đăng nhập</span>
              <div className={`${inputGroupClass} no-border`}>
                <User size={18} className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  name="username"
                  placeholder="Nhập tên đăng nhập"
                  required
                  disabled={isAuthBusy}
                  className={inputClass}
                  onChange={handleChange}
                  value={formData.username}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu</span>
              <div className={`${inputGroupClass} no-border`}>
                <Lock size={18} className="shrink-0 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Nhập mật khẩu"
                  required
                  disabled={isAuthBusy}
                  className={inputClass}
                  onChange={handleChange}
                  value={formData.password}
                />
                <button
                  type="button"
                  disabled={isAuthBusy}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={isAuthBusy}
              className="app-btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {isSubmitting ? (isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...') : isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </button>

            {isLogin && hasGoogleClientId && (
              <>
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">Hoặc</span>
                  </div>
                </div>

                <div className="relative flex justify-center rounded-xl border border-slate-200 bg-slate-50 py-2">
                  {isGoogleSubmitting && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-xl bg-white/85 text-sm font-medium text-slate-700">
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                      Đang đăng nhập Google...
                    </div>
                  )}
                  <div className={isAuthBusy ? 'pointer-events-none opacity-60' : undefined}>
                    <GoogleLogin onSuccess={handleGoogleLoginSuccess} onError={() => setError('Đăng nhập Google thất bại')} useOneTap={false} />
                  </div>
                </div>
              </>
            )}

            {isLogin && !hasGoogleClientId && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                Đăng nhập Google chưa được cấu hình. Đặt biến <code>VITE_GOOGLE_CLIENT_ID</code> trong file <code>.env</code>.
              </div>
            )}
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button
              type="button"
              disabled={isAuthBusy}
              className="ml-1 font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setShowPassword(false);
              }}
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
