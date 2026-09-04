import React from 'react';
import { Button, Icon } from '@bug-on/m3-expressive';
import { useAuth } from '../context/AuthContext';

const AccountStatusPage: React.FC = () => {
  const { user, logout } = useAuth();
  const status = user?.teacherApprovalStatus || (user?.role === 'PendingTeacher' ? 'Pending' : undefined);
  const isRejected = status === 'Rejected';

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-m3-surface p-4 text-m3-on-surface">
      {/* Background Decorative Blur Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-20 -right-20 h-96 w-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--md-sys-color-primary)' }}
        />
        <div
          className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full blur-3xl opacity-20"
          style={{ background: isRejected ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-tertiary, #10b981)' }}
        />
      </div>

      <section className="relative z-10 w-full max-w-lg overflow-hidden rounded-4xl border border-m3-outline-variant/60 bg-m3-surface-container p-8 text-center shadow-xl">
        {/* Status Badge Icon */}
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${
            isRejected
              ? 'bg-m3-error-container text-m3-on-error-container'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          }`}
        >
          <Icon
            name={isRejected ? 'gpp_bad' : 'hourglass_top'}
            className="text-4xl"
          />
        </div>

        <h1 className="mt-6 text-2xl font-black tracking-tight text-m3-on-surface">
          {isRejected ? 'Yêu cầu giáo viên đã bị từ chối' : 'Tài khoản đang chờ duyệt'}
        </h1>

        <p className="mt-2.5 text-sm leading-relaxed text-m3-on-surface-variant">
          {isRejected
            ? 'Tài khoản của bạn hiện chưa được cấp quyền giáo viên. Vui lòng liên hệ Admin nếu cần hỗ trợ xem xét lại.'
            : 'Tài khoản đã được khởi tạo thành công và đang chờ Quản trị viên phê duyệt quyền giáo viên. Bạn vẫn có thể đăng nhập để theo dõi trạng thái.'}
        </p>

        {user?.teacherApprovalNote && (
          <div className="mt-5 rounded-2xl border border-m3-outline-variant/60 bg-m3-surface p-4 text-left text-xs">
            <div className="flex items-center gap-1.5 font-bold text-m3-on-surface">
              <Icon name="feedback" className="text-base text-m3-primary" />
              <span>Ghi chú từ Quản trị viên</span>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-m3-on-surface-variant leading-relaxed">
              {user.teacherApprovalNote}
            </p>
          </div>
        )}

        <div className="mt-6 space-y-2 rounded-2xl border border-m3-outline-variant/40 bg-m3-surface/60 p-4 text-left text-xs text-m3-on-surface-variant">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-m3-on-surface">Họ và tên:</span>
            <span>{user?.fullName || user?.username}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-m3-on-surface">Thư điện tử:</span>
            <span>{user?.email || 'Chưa cập nhật'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-m3-on-surface">Trạng thái hiện tại:</span>
            <span
              className={`font-bold ${
                isRejected
                  ? 'text-m3-error'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {status || 'Đang chờ duyệt (Pending)'}
            </span>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            colorStyle="filled"
            size="md"
            type="button"
            onClick={logout}
          >
            <div className="flex items-center gap-2">
              <Icon name="logout" className="text-lg" />
              <span>Đăng xuất</span>
            </div>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AccountStatusPage;