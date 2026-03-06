import { clsx } from 'clsx';
import { LogOut, type LucideIcon } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
        "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors",
        isActive
          ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
          : "text-gray-600 hover:bg-gray-50"
      )
    }
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

interface SidebarProps {
  isOpen: boolean;
  navItems: Array<{ id: string; label: string; icon: LucideIcon; path: string }>;
  onNavigate?: () => void;
}

const Sidebar = ({ isOpen, navItems, onNavigate }: SidebarProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmed = window.confirm('bạn có chắc chắn muốn đăng xuất không?');
    if (!confirmed) return;

    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={clsx(
        "bg-white w-64 shadow-md flex-shrink-0 transition-all duration-300 flex flex-col fixed lg:relative inset-y-0 left-0 z-40 transform lg:transform-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:-ml-64"
      )}
    >
      <div className="p-6 border-b border-gray-100 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
          M
        </div>
        <h1 className="text-xl font-bold text-gray-800">MOS Grader</h1>
      </div>

      <nav className="mt-6 flex-1">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            path={item.path}
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
