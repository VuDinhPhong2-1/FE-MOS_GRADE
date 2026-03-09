import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { notify } from '../../utils/notify';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileFormState {
  fullName: string;
  phoneNumber: string;
  avatar: string;
}

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user, getAccessToken, updateUser } = useAuth();
  const [form, setForm] = useState<ProfileFormState>({
    fullName: '',
    phoneNumber: '',
    avatar: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    setForm({
      fullName: user.fullName || '',
      phoneNumber: user.phoneNumber || '',
      avatar: user.avatar || '',
    });
  }, [isOpen, user]);

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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-3 backdrop-blur-[1px]">
      <div className="app-card w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Chỉnh sửa tài khoản</h3>
            <p className="text-xs text-slate-500">Cập nhật hồ sơ cá nhân của bạn</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            aria-label="Đóng hộp thoại"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid gap-1">
            <label htmlFor="profile-username" className="text-sm font-semibold text-slate-700">
              Tên đăng nhập
            </label>
            <input
              id="profile-username"
              type="text"
              readOnly
              value={user.username}
              className="w-full cursor-not-allowed bg-slate-100 px-3 py-2 text-slate-500"
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="profile-email" className="text-sm font-semibold text-slate-700">
              Thư điện tử
            </label>
            <input
              id="profile-email"
              type="text"
              readOnly
              value={user.email || ''}
              className="w-full cursor-not-allowed bg-slate-100 px-3 py-2 text-slate-500"
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="profile-fullname" className="text-sm font-semibold text-slate-700">
              Họ và tên
            </label>
            <input
              id="profile-fullname"
              type="text"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Ví dụ: Vũ Đình Phong"
              className="w-full px-3 py-2"
              maxLength={120}
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="profile-phone" className="text-sm font-semibold text-slate-700">
              Số điện thoại
            </label>
            <input
              id="profile-phone"
              type="text"
              value={form.phoneNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
              placeholder="Ví dụ: 0909xxxxxx"
              className="w-full px-3 py-2"
              maxLength={25}
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="profile-avatar" className="text-sm font-semibold text-slate-700">
              Ảnh đại diện (URL)
            </label>
            <input
              id="profile-avatar"
              type="text"
              value={form.avatar}
              onChange={(event) => setForm((prev) => ({ ...prev, avatar: event.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2"
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="app-btn-secondary px-4 py-2 text-sm"
              disabled={saving}
            >
              Hủy
            </button>
            <button type="submit" className="app-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm" disabled={saving}>
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
