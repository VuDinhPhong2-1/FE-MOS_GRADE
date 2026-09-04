import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ShapeMedia, ProgressIndicator } from '@bug-on/m3-expressive';
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

  const getPostLoginPath = (data: LoginResponse) => {
    if (
      data.role === 'PendingTeacher' ||
      (
        data.role === 'Teacher' &&
        (data.teacherApprovalStatus === 'Pending' || data.teacherApprovalStatus === 'Rejected')
      )
    ) {
      return '/account-status';
    }

    return '/dashboard';
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
        teacherApprovalStatus: data.teacherApprovalStatus,
        teacherApprovalRequestedAt: data.teacherApprovalRequestedAt,
        teacherApprovalReviewedAt: data.teacherApprovalReviewedAt,
        teacherApprovalReviewedBy: data.teacherApprovalReviewedBy,
        teacherApprovalNote: data.teacherApprovalNote,
      },
      data.accessToken,
      data.refreshToken
    );

    navigate(getPostLoginPath(data));
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
        notify.success('Tài khoản đã tạo, đang chờ Admin duyệt quyền giáo viên.');
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
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--md-sys-color-surface)] p-4 text-[var(--md-sys-color-on-surface)] transition-colors">
      {/* Decorative M3 Expressive Background Blur Orbs */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full blur-3xl opacity-30"
        style={{ background: 'var(--md-sys-color-primary)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full blur-3xl opacity-20"
        style={{ background: 'var(--md-sys-color-tertiary, #10b981)' }}
      />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] shadow-[0_24px_48px_rgba(0,0,0,0.14)] lg:grid-cols-[1.1fr_1fr]">
        {/* Left Panel with M3 Expressive ShapeMedia */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[var(--md-sys-color-primary)] via-[var(--md-sys-color-primary)]/90 to-[var(--md-sys-color-on-primary-container)] p-10 text-[var(--md-sys-color-on-primary)] lg:flex">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:24px_24px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
              <ShieldCheck size={16} />
              MOS Grader Pro
            </div>
            <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight">
              Hệ thống quản lý và chấm điểm MOS
            </h1>
            <p className="mt-3 text-sm opacity-90 leading-relaxed">
              Theo dõi lớp học, chấm điểm bài tập tự động và tổng hợp kết quả trực quan theo tiêu chuẩn Material Design 3 Expressive.
            </p>
          </div>

          {/* Center Showcase: Animated M3 ShapeMedia */}
          <div className="relative z-10 my-8 flex items-center justify-center">
            <ShapeMedia
              shape="pill"
              morphTo="sunny"
              morphOn="hover"
              className="flex h-36 w-36 items-center justify-center bg-white/15 backdrop-blur-md transition-all duration-300 shadow-xl"
            >
              <div className="grid place-items-center text-center p-3">
                <span className="text-3xl font-black">MOS</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider opacity-85">Expressive</span>
              </div>
            </ShapeMedia>
          </div>

          {/* Bottom Features List */}
          <div className="relative z-10 space-y-2.5 text-xs">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
              ✨ Chấm điểm tự động theo từng dự án và từng học sinh
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
              📊 Xuất bảng điểm chi tiết, trực quan phục vụ báo cáo
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
              🏫 Quản lý trường, lớp, học sinh và phân quyền toàn diện
            </div>
          </div>
        </div>

        {/* Right Panel: Form Area */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-[var(--md-sys-color-surface-container)]">
          <div className="mb-2">
            <h2 className="text-2xl font-black tracking-tight text-[var(--md-sys-color-on-surface)]">
              {isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}
            </h2>
            <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              {isLogin ? 'Chào mừng bạn quay lại MOS Grader.' : 'Tạo tài khoản mới để bắt đầu sử dụng.'}
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)] px-4 py-2.5 text-xs font-medium text-[var(--md-sys-color-on-error-container)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!isLogin && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                  Thư điện tử
                </span>
                <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] px-3.5 transition-all focus-within:border-[var(--md-sys-color-primary)] focus-within:shadow-[0_0_0_2px_var(--md-sys-color-primary)]">
                  <Mail size={18} className="shrink-0 text-[var(--md-sys-color-on-surface-variant)]" />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    disabled={isAuthBusy}
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 disabled:cursor-not-allowed"
                    onChange={handleChange}
                    value={formData.email}
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Tên đăng nhập
              </span>
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] px-3.5 transition-all focus-within:border-[var(--md-sys-color-primary)] focus-within:shadow-[0_0_0_2px_var(--md-sys-color-primary)]">
                <User size={18} className="shrink-0 text-[var(--md-sys-color-on-surface-variant)]" />
                <input
                  type="text"
                  name="username"
                  placeholder="Nhập tên đăng nhập"
                  required
                  disabled={isAuthBusy}
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 disabled:cursor-not-allowed"
                  onChange={handleChange}
                  value={formData.username}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                Mật khẩu
              </span>
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] px-3.5 transition-all focus-within:border-[var(--md-sys-color-primary)] focus-within:shadow-[0_0_0_2px_var(--md-sys-color-primary)]">
                <Lock size={18} className="shrink-0 text-[var(--md-sys-color-on-surface-variant)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Nhập mật khẩu"
                  required
                  disabled={isAuthBusy}
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 disabled:cursor-not-allowed"
                  onChange={handleChange}
                  value={formData.password}
                />
                <button
                  type="button"
                  disabled={isAuthBusy}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={isAuthBusy}
              className="app-btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <ProgressIndicator
                  variant="circular"
                  shape="wavy"
                  size={20}
                  aria-label={isLogin ? 'Đang đăng nhập' : 'Đang đăng ký'}
                />
              ) : null}
              <span>{isSubmitting ? (isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...') : isLogin ? 'Đăng nhập' : 'Đăng ký'}</span>
            </button>

            {isLogin && hasGoogleClientId && (
              <>
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[var(--md-sys-color-outline-variant)]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[var(--md-sys-color-surface-container)] px-3 text-[var(--md-sys-color-on-surface-variant)]">
                      Hoặc
                    </span>
                  </div>
                </div>

                <div className="relative flex justify-center rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] py-2">
                  {isGoogleSubmitting && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl bg-[var(--md-sys-color-surface)]/85 text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                      <ProgressIndicator
                        variant="circular"
                        shape="wavy"
                        size={18}
                        aria-label="Đang đăng nhập Google"
                      />
                      <span>Đang đăng nhập Google...</span>
                    </div>
                  )}
                  <div className={isAuthBusy ? 'pointer-events-none opacity-60' : undefined}>
                    <GoogleLogin onSuccess={handleGoogleLoginSuccess} onError={() => setError('Đăng nhập Google thất bại')} useOneTap={false} />
                  </div>
                </div>
              </>
            )}

            {isLogin && !hasGoogleClientId && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-200">
                Đăng nhập Google chưa được cấu hình. Đặt biến <code>VITE_GOOGLE_CLIENT_ID</code> trong file <code>.env</code>.
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button
              type="button"
              disabled={isAuthBusy}
              className="ml-1.5 font-bold text-[var(--md-sys-color-primary)] hover:underline"
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
