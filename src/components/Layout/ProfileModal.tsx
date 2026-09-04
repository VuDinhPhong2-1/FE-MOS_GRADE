import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--md-sys-color-scrim)]/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">Chỉnh sửa tài khoản</h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Cập nhật hồ sơ cá nhân của bạn</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-on-surface)]"
            aria-label="Đóng hộp thoại"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid gap-1.5">
            <label htmlFor="profile-username" className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Tên đăng nhập
            </label>
            <input
              id="profile-username"
              type="text"
              readOnly
              value={user.username}
              className="w-full cursor-not-allowed opacity-70 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="profile-email" className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Thư điện tử
            </label>
            <input
              id="profile-email"
              type="text"
              readOnly
              value={user.email || ''}
              className="w-full cursor-not-allowed opacity-70 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="profile-fullname" className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Họ và tên
            </label>
            <input
              id="profile-fullname"
              type="text"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Ví dụ: Vũ Đình Phong"
              className="w-full px-3.5 py-2.5 text-sm"
              maxLength={120}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="profile-phone" className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
              Số điện thoại
            </label>
            <input
              id="profile-phone"
              type="text"
              value={form.phoneNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
              placeholder="Ví dụ: 0909xxxxxx"
              className="w-full px-3.5 py-2.5 text-sm"
              maxLength={25}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="profile-avatar" className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
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
              className="w-full px-3.5 py-2.5 text-sm"
              maxLength={500}
            />
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2.5 border-t border-[var(--md-sys-color-outline-variant)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="app-btn-secondary px-5 py-2.5 text-sm"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="app-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
