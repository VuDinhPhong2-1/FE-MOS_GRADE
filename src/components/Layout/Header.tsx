import { useState } from 'react';
import { Menu, Settings2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ProfileModal from './ProfileModal';

interface HeaderProps {
  onToggleSidebar: () => void;
  fullName?: string;
}

const Header = ({ onToggleSidebar, fullName = 'Giáo viên' }: HeaderProps) => {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const displayName = user?.fullName?.trim() || user?.username || fullName;

  return (
    <>
      <header
        className="sticky top-0 z-20 flex items-center border-b border-slate-200/80 bg-white/85 px-3 shadow-sm backdrop-blur sm:px-5"
        style={{
          minHeight: 'calc(4rem + env(safe-area-inset-top))',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <button
          onClick={onToggleSidebar}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
          aria-label="Bật hoặc tắt thanh bên"
        >
          <Menu size={20} />
        </button>

        <div className="ml-auto flex min-w-0 items-center gap-3">
          <div className="hidden text-sm text-slate-600 sm:block">
            Xin chào, <span className="font-semibold text-slate-900">{displayName}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            aria-label="Chỉnh sửa thông tin tài khoản"
          >
            <div
              className="relative h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white overflow-hidden bg-center bg-cover"
              style={
                ((previewAvatar && previewAvatar.trim()) || user?.avatar)
                  ? { backgroundImage: `url(${(previewAvatar && previewAvatar.trim()) || user?.avatar})` }
                  : undefined
              }
            >
              {!((previewAvatar && previewAvatar.trim()) || user?.avatar) && (
                <div className="grid h-full w-full place-items-center text-white">{(displayName || 'GV').trim().charAt(0).toUpperCase()}</div>
              )}
            </div>
            <span className="hidden sm:inline">Sửa tài khoản</span>
            <Settings2 size={14} />
          </button>
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setPreviewAvatar(null);
        }}
        onAvatarPreview={(url) => setPreviewAvatar(url || null)}
      />
    </>
  );
};

export default Header;
