import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
  Button,
  IconButton,
  Icon,
  TextField,
} from '@bug-on/m3-expressive';
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
  const { user, getAccessToken, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileFormState>({
    fullName: '',
    phoneNumber: '',
    avatar: '',
  });
  const [saving, setSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) {
      setConfirmLogout(false);
      return;
    }
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

  if (!user) return null;

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login', { replace: true });
    notify.success('Đã đăng xuất thành công');
  };

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal open={isOpen}>
        <DialogOverlay />
        <DialogContent
          hideCloseButton
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <DialogHeader className="mb-0 gap-0.5">
                <DialogTitle className="text-lg font-bold text-m3-on-surface">
                  Chỉnh sửa tài khoản
                </DialogTitle>
                <DialogDescription className="text-xs text-m3-on-surface-variant">
                  Cập nhật hồ sơ cá nhân của bạn
                </DialogDescription>
              </DialogHeader>
              <DialogClose asChild>
                <IconButton
                  type="button"
                  size="sm"
                  colorStyle="standard"
                  aria-label="Đóng hộp thoại"
                  onClick={onClose}
                >
                  <Icon name="close" />
                </IconButton>
              </DialogClose>
            </div>

            {/* Body */}
            <DialogBody className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pt-2 pb-6 pr-5">
              {/* Avatar Preview & Profile Summary Card */}
              <div className="flex items-center gap-4 rounded-xl bg-m3-surface-container p-3 mb-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-m3-surface-container-highest ring-2 ring-m3-outline-variant/30">
                  {form.avatar ? (
                    <img
                      src={form.avatar}
                      alt={form.fullName || user.username}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-m3-primary">
                      <Icon name="account_circle" size={40} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-m3-on-surface">
                    {form.fullName || user.fullName || user.username}
                  </div>
                  <div className="truncate text-xs text-m3-on-surface-variant">
                    {user.email || 'Chưa có email'}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-m3-primary/10 px-2 py-0.5 text-[11px] font-semibold text-m3-primary">
                    <Icon name="verified_user" className="text-xs" />
                    <span>{user.role || 'Người dùng'}</span>
                  </div>
                </div>
              </div>

              <TextField
                variant="outlined"
                label="Tên đăng nhập"
                readOnly
                fullWidth
                value={user.username}
                supportingText="Tên tài khoản không thể thay đổi"
                leadingIcon={<Icon name="person" />}
                className="pt-2.5"
              />

              <TextField
                variant="outlined"
                label="Thư điện tử"
                readOnly
                fullWidth
                value={user.email || ''}
                supportingText="Địa chỉ thư điện tử định danh"
                leadingIcon={<Icon name="mail" />}
                className="pt-2.5"
              />

              <TextField
                variant="outlined"
                label="Họ và tên"
                placeholder="Ví dụ: Vũ Đình Phong"
                fullWidth
                maxLength={120}
                value={form.fullName}
                onChange={(value: string) => setForm((prev) => ({ ...prev, fullName: value }))}
                leadingIcon={<Icon name="badge" />}
                className="pt-2.5"
              />

              <TextField
                variant="outlined"
                type="tel"
                label="Số điện thoại"
                placeholder="Ví dụ: 0909xxxxxx"
                fullWidth
                maxLength={25}
                value={form.phoneNumber}
                onChange={(value: string) => setForm((prev) => ({ ...prev, phoneNumber: value }))}
                leadingIcon={<Icon name="call" />}
                className="pt-2.5"
              />

              <TextField
                variant="outlined"
                label="Ảnh đại diện (URL)"
                placeholder="https://..."
                fullWidth
                maxLength={500}
                value={form.avatar}
                onChange={(value: string) => {
                  setForm((prev) => ({ ...prev, avatar: value }));
                  if (onAvatarPreview) onAvatarPreview(value || '');
                }}
                leadingIcon={<Icon name="image" />}
                className="pt-2.5"
              />
            </DialogBody>

            {/* Footer */}
            <DialogFooter className="mt-0 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-m3-outline-variant/30 px-6 py-4 sm:flex-row sm:space-x-0">
              {confirmLogout ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-m3-error-container/40 px-3 py-1.5 text-xs font-semibold text-m3-error animate-in fade-in zoom-in duration-150">
                  <span>Xác nhận đăng xuất?</span>
                  <Button
                    type="button"
                    size="xs"
                    colorStyle="filled"
                    onClick={handleLogout}
                    className="bg-m3-error text-m3-on-error hover:bg-m3-error/90 shadow-xs"
                  >
                    Đồng ý
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    colorStyle="tonal"
                    onClick={() => setConfirmLogout(false)}
                  >
                    Hủy
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  colorStyle="text"
                  size="sm"
                  onClick={() => setConfirmLogout(true)}
                  icon={<Icon name="logout" className="text-base" />}
                  className="text-m3-error hover:bg-m3-error/8 active:bg-m3-error/12"
                >
                  Đăng xuất
                </Button>
              )}

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  colorStyle="tonal"
                  size="sm"
                  onClick={onClose}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  colorStyle="filled"
                  size="sm"
                  loading={saving}
                  loadingVariant="circular"
                  disabled={saving}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default ProfileModal;
