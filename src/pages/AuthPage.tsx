import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Button, Divider, Icon, ShapeMedia, TextField } from '@bug-on/m3-expressive';
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
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const isAuthBusy = isSubmitting || isGoogleSubmitting;

  const handleFieldChange = (field: keyof RegisterFormData) => (value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-m3-surface p-4 text-m3-on-surface transition-colors">
      {/* Decorative M3 Expressive Background Blur Orbs (Isolated layer to prevent unnecessary scrollbars) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-20 -top-20 h-96 w-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'var(--md-sys-color-primary)' }}
        />
        <div
          className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--md-sys-color-tertiary, #10b981)' }}
        />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-4xl bg-m3-surface-container shadow-[0_24px_48px_rgba(0,0,0,0.14)] lg:grid-cols-[1.1fr_1fr]">
        {/* Left Panel with M3 Expressive ShapeMedia */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-m3-primary via-m3-primary/90 to-(--md-sys-color-on-primary-container) p-8 lg:p-10 text-m3-on-primary lg:flex rounded-r-4xl">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-size-[24px_24px]" />

          <div className="relative z-10">
            {/* Custom badge preserving left panel contrast with MD3 Material Symbol */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
              <Icon name="verified_user" className="text-base" />
              MOS Grader Pro
            </div>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight">
              Hệ thống quản lý và chấm điểm MOS
            </h1>
            <p className="mt-2.5 text-sm opacity-90 leading-relaxed">
              Theo dõi lớp học, chấm điểm bài tập tự động và tổng hợp kết quả trực quan theo tiêu chuẩn Material Design 3 Expressive.
            </p>
          </div>

          {/* Center Showcase: Animated M3 ShapeMedia */}
          <div className="relative z-10 my-4 lg:my-6 flex items-center justify-center">
            <ShapeMedia
              shape="cookie4Sided"
              morphTo="cookie12Sided"
              morphOn="hover"
              morphOptions={{
                duration: 0.4,
                easing: [0.34, 1.56, 0.64, 1]
              }}
              className="flex h-32 w-32 lg:h-36 lg:w-36 items-center justify-center bg-white/15 backdrop-blur-md shadow-xl cursor-pointer"
            >
              <div className="grid place-items-center text-center p-3">
                <span className="text-3xl font-black">MOS</span>
              </div>
            </ShapeMedia>
          </div>

          {/* Bottom Features List */}
          <div className="relative z-10 space-y-2 text-xs">
            <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
              ✨ Chấm điểm tự động theo từng dự án và từng học sinh
            </div>
            <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
              📊 Xuất bảng điểm chi tiết, trực quan phục vụ báo cáo
            </div>
            <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
              🏫 Quản lý trường, lớp, học sinh và phân quyền toàn diện
            </div>
          </div>
        </div>

        {/* Right Panel: Form Area */}
        <div className="p-6 sm:p-8 lg:p-8 flex flex-col justify-center bg-m3-surface-container">
          <div className="mb-3">
            <h2 className="text-2xl font-black tracking-tight text-m3-on-surface">
              {isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}
            </h2>
            <p className="mt-1 text-sm text-m3-on-surface-variant">
              {isLogin ? 'Chào mừng bạn quay lại MOS Grader.' : 'Tạo tài khoản mới để bắt đầu sử dụng.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-m3-error bg-m3-error-container px-4 py-2.5 text-xs font-medium text-m3-on-error-container">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <TextField
                variant="outlined"
                type="email"
                name="email"
                label="Thư điện tử"
                placeholder="you@example.com"
                required
                disabled={isAuthBusy}
                fullWidth
                leadingIcon={<Icon name="mail" />}
                value={formData.email}
                onChange={handleFieldChange('email')}
              />
            )}

            <TextField
              variant="outlined"
              type="text"
              name="username"
              label="Tên đăng nhập"
              placeholder="Nhập tên đăng nhập"
              required
              disabled={isAuthBusy}
              fullWidth
              leadingIcon={<Icon name="person" />}
              value={formData.username}
              onChange={handleFieldChange('username')}
            />

            <TextField
              variant="outlined"
              type="password"
              name="password"
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              required
              disabled={isAuthBusy}
              fullWidth
              leadingIcon={<Icon name="lock" />}
              trailingIconMode="password-toggle"
              value={formData.password}
              onChange={handleFieldChange('password')}
            />

            <div className="pt-2">
              <Button
                colorStyle="filled"
                type="submit"
                disabled={isAuthBusy}
                fullWidth
                size="md"
                loading={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <span>{isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...'}</span>
                  </div>
                ) : (
                  <span>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</span>
                )}
              </Button>
            </div>

            {isLogin && hasGoogleClientId && (
              <>
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <Divider shape='wavy' />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-m3-surface-container px-3 text-m3-on-surface-variant">
                      Hoặc
                    </span>
                  </div>
                </div>

                <div className="relative w-full">
                  <Button
                    colorStyle="outlined"
                    type="button"
                    disabled={isAuthBusy}
                    fullWidth
                    size="md"
                    loading={isGoogleSubmitting}
                    icon={
                      !isGoogleSubmitting ? (
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      ) : undefined
                    }
                  >
                    {isGoogleSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <span>Đang đăng nhập Google...</span>
                      </div>
                    ) : (
                      <span>Đăng nhập bằng Google</span>
                    )}
                  </Button>

                  {!isGoogleSubmitting && (
                    <div
                      aria-hidden="true"
                      className={`absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-0 ${isAuthBusy ? 'pointer-events-none' : 'cursor-pointer'
                        }`}
                    >
                      <div className="flex w-full origin-center scale-150 justify-center">
                        <GoogleLogin
                          onSuccess={handleGoogleLoginSuccess}
                          onError={() => setError('Đăng nhập Google thất bại')}
                          useOneTap={false}
                          width="400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {isLogin && !hasGoogleClientId && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-200">
                Đăng nhập Google chưa được cấu hình. Đặt biến <code>VITE_GOOGLE_CLIENT_ID</code> trong file <code>.env</code>.
              </div>
            )}
          </form>

          <div className="mt-6 flex items-center justify-center gap-1 text-xs text-m3-on-surface-variant">
            <span>{isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}</span>
            <Button
              colorStyle="text"
              type="button"
              disabled={isAuthBusy}
              size="sm"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

