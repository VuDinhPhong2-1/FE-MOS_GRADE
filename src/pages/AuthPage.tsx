import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Button, Divider, Icon, ProgressIndicator, ShapeMedia, TextField } from '@bug-on/m3-expressive';
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

                <div className="relative flex justify-center rounded-2xl border border-m3-outline-variant bg-m3-surface py-2">
                  {isGoogleSubmitting && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl bg-m3-surface/85 text-xs font-semibold text-m3-on-surface">
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

