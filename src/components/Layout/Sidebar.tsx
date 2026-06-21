import { clsx } from 'clsx';
import { ChevronDown, LogOut, type LucideIcon } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  children?: Array<{
    id: string;
    label: string;
    path: string;
  }>;
}

interface NavItemProps {
  label: string;
  icon: LucideIcon;
  path: string;
  onClick?: () => void;
}

const NavItem = ({ label, icon: Icon, path, onClick }: NavItemProps) => (
  <NavLink
    to={path}
    onClick={onClick}
    className={({ isActive }) =>
      clsx(
        'mx-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
        isActive
          ? 'bg-white/24 !text-white shadow-[0_6px_16px_rgba(15,23,42,0.24)]'
          : '!text-slate-100 hover:bg-white/14 hover:!text-white'
      )
    }
  >
    <Icon size={18} />
    <span>{label}</span>
  </NavLink>
);

interface NavDropdownProps {
  item: SidebarNavItem;
  onNavigate?: () => void;
}

const NavDropdown = ({ item, onNavigate }: NavDropdownProps) => (
  <div className="mx-2">
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
          isActive
            ? 'bg-white/24 !text-white shadow-[0_6px_16px_rgba(15,23,42,0.24)]'
            : '!text-slate-100 hover:bg-white/14 hover:!text-white'
        )
      }
    >
      <item.icon size={18} />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      <ChevronDown size={16} className="text-slate-100/80" />
    </NavLink>

    <div className="mt-1 space-y-1 pl-8">
      {item.children?.map((child) => (
        <NavLink
          key={child.id}
          to={child.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'block rounded-lg px-3 py-2 text-sm transition-all',
              isActive
                ? 'bg-white/18 font-semibold !text-white'
                : '!text-slate-200/90 hover:bg-white/10 hover:!text-white'
            )
          }
        >
          {child.label}
        </NavLink>
      ))}
    </div>
  </div>
);

interface SidebarProps {
  isOpen: boolean;
  navItems: SidebarNavItem[];
  onNavigate?: () => void;
}

const Sidebar = ({ isOpen, navItems, onNavigate }: SidebarProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn đăng xuất không?');
    if (!confirmed) return;

    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-shrink-0 transform flex-col border-r border-blue-900/30 bg-gradient-to-b from-slate-900 via-blue-900 to-blue-950 shadow-2xl transition-all duration-300 lg:relative lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-64'
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-lg font-extrabold text-white">
          M
        </div>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-extrabold text-white">MOS Grader</h1>
        <p className="text-xs text-slate-200/95">Hệ thống chấm điểm MOS</p>
      </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1">
        {navItems.map((item) =>
          item.children?.length ? (
            <NavDropdown key={item.id} item={item} onNavigate={onNavigate} />
          ) : (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              path={item.path}
              onClick={onNavigate}
            />
          )
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl border border-red-300/35 bg-red-500/20 px-4 py-3 text-left text-red-50 transition hover:bg-red-500/28"
        >
          <LogOut size={18} />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
