import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface NavItemProps {
  label: string;
  icon: LucideIcon;
  path: string;
}

const NavItem = ({ label, icon: Icon, path }: NavItemProps) => (
  <NavLink
    to={path}
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
}

const Sidebar = ({ isOpen, navItems }: SidebarProps) => {
  return (
    <aside
      className={clsx(
        "bg-white w-64 shadow-md flex-shrink-0 transition-all duration-300",
        !isOpen && "-ml-64"
      )}
    >
      <div className="p-6 border-b border-gray-100 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
          M
        </div>
        <h1 className="text-xl font-bold text-gray-800">MOS Grader</h1>
      </div>

      <nav className="mt-6">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            path={item.path}
          />
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
