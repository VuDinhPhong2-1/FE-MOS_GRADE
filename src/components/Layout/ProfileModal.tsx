import { useEffect, useState, type FormEvent } from 'react';
import { Icon, ProgressIndicator } from '@bug-on/m3-expressive';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { notify } from '../../utils/notify';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarPreview?: (url: string) => void;
}

interface ProfileFormState {
  fullName: string;
  phoneNumber: string;
  avatar: string;
}

export const ProfileModal = ({ isOpen, onClose, onAvatarPreview }: ProfileModalProps) => {
  const { user, getAccessToken, updateUser } = useAuth();
  const [form, setForm] = useState<ProfileFormState>({
    fullName: '',
    phoneNumber: '',
    avatar: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    const initial = {
      fullName: user.fullName || '',
      phoneNumber: user.phoneNumber || '',
      avatar: user.avatar || '',
    };
    setForm(initial);
    if (onAvatarPreview) onAvatarPreview(initial.avatar || '');
    return () => {
      if (onAvatarPreview) onAvatarPreview('');
    };
  }, [isOpen, user, onAvatarPreview]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      const updated = await authService.updateCurrentUserProfile(
        {
          fullName: form.fullName,
          phoneNumber: form.phoneNumber,
          avatar: form.avatar,
        },
        getAccessToken
      );

      updateUser({
        fullName: updated.fullName,
        phoneNumber: updated.phoneNumber,
        avatar: updated.avatar,
      });

      notify.success('Cập nhật thông tin tài khoản thành công');
      onClose();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể cập nhật thông tin tài khoản');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-4xl border border-m3-outline-variant/60 bg-m3-surface-container-high text-m3-on-surface shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-m3-outline-variant px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-m3-on-surface">Chỉnh sửa tài khoản</h3>
            <p className="text-xs text-m3-on-surface-variant">Cập nhật hồ sơ cá nhân của bạn</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-m3-outline-variant text-m3-on-surface-variant transition-colors hover:bg-m3-surface-container-highest hover:text-m3-on-surface"
            aria-label="Đóng hộp thoại"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid gap-1.5">
            <label htmlFor="profile-username" className="text-xs font-semibold text-m3-on-surface-variant">
              Tên đăng nhập
            </label>
            <input
              id="profile-username"
              type="text"
              readOnly
              value={user.username}
              className="w-full cursor-not-allowed rounded-xl border border-m3-outline-variant/60 bg-m3-surface-container px-3.5 py-2.5 text-sm opacity-70 text-m3-on-surface"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="profile-email" className="text-xs font-semibold text-m3-on-surface-variant">
              Thư điện tử
            </label>
            <input
              id="profile-email"
              type="text"
              readOnly
              value={user.email || ''}
              className="w-full cursor-not-allowed rounded-xl border border-m3-outline-variant/60 bg-m3-surface-container px-3.5 py-2.5 text-sm opacity-70 text-m3-on-surface"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="profile-fullname" className="text-xs font-semibold text-m3-on-surface-variant">
              Họ và tên
            </label>
            <input
              id="profile-fullname"
              type="text"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Ví dụ: Vũ Đình Phong"
              className="w-full rounded-xl border border-m3-outline-variant bg-m3-surface-container px-3.5 py-2.5 text-sm text-m3-on-surface focus:border-m3-primary focus:outline-none"
              maxLength={120}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="profile-phone" className="text-xs font-semibold text-m3-on-surface-variant">
              Số điện thoại
            </label>
            <input
              id="profile-phone"
              type="text"
              value={form.phoneNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
              placeholder="Ví dụ: 0909xxxxxx"
              className="w-full rounded-xl border border-m3-outline-variant bg-m3-surface-container px-3.5 py-2.5 text-sm text-m3-on-surface focus:border-m3-primary focus:outline-none"
              maxLength={25}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="profile-avatar" className="text-xs font-semibold text-m3-on-surface-variant">
              Ảnh đại diện (URL)
            </label>
            <input
              id="profile-avatar"
              type="text"
              value={form.avatar}
              onChange={(event) => {
                const next = event.target.value;
                setForm((prev) => ({ ...prev, avatar: next }));
                if (onAvatarPreview) onAvatarPreview(next || '');
              }}
              placeholder="https://..."
              className="w-full rounded-xl border border-m3-outline-variant bg-m3-surface-container px-3.5 py-2.5 text-sm text-m3-on-surface focus:border-m3-primary focus:outline-none"
              maxLength={500}
            />
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2.5 border-t border-m3-outline-variant pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-m3-outline-variant px-5 py-2.5 text-sm font-semibold text-m3-on-surface transition-colors hover:bg-m3-surface-container-highest"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-m3-primary px-5 py-2.5 text-sm font-semibold text-m3-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? <ProgressIndicator variant="circular" shape="wavy" size={16} aria-label="Đang lưu" /> : null}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
