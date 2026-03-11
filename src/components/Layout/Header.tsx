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
            <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
              {(displayName || 'GV').trim().charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline">Sửa tài khoản</span>
            <Settings2 size={14} />
          </button>
        </div>
      </header>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Header;
