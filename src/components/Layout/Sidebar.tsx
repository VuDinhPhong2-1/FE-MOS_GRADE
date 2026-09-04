import { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, ChevronRight, LogOut, type LucideIcon } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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

interface SidebarProps {
  isOpen: boolean;
  navItems: SidebarNavItem[];
  onNavigate?: () => void;
}

export const Sidebar = ({ isOpen, navItems, onNavigate }: SidebarProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Lưu trạng thái mở dropdown của các menu có children
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children?.length) {
        // Tự động mở nếu route hiện tại đang nằm trong children
        const isChildActive = item.children.some((child) => location.pathname.startsWith(child.path));
        initialState[item.id] = isChildActive;
      }
    });
    return initialState;
  });

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdowns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn đăng xuất không?');
    if (!confirmed) return;

    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] transition-all duration-300 ease-in-out lg:relative',
        isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:w-20 lg:translate-x-0'
      )}
    >
      {/* App Header / Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--md-sys-color-outline-variant)] px-4">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-[var(--md-sys-color-primary)] text-base font-extrabold text-[var(--md-sys-color-on-primary)] shadow-sm">
          M
        </div>
        {isOpen && (
          <div className="min-w-0 flex-1 overflow-hidden transition-opacity duration-200">
            <h1 className="truncate text-base font-extrabold text-[var(--md-sys-color-on-surface)]">MOS Grader</h1>
            <p className="truncate text-xs text-[var(--md-sys-color-on-surface-variant)]">Hệ thống chấm điểm</p>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const isDropdownOpen = Boolean(openDropdowns[item.id]);
          const isParentActive =
            location.pathname === item.path ||
            Boolean(item.children?.some((child) => location.pathname.startsWith(child.path)));

          if (hasChildren) {
            return (
              <div key={item.id} className="space-y-1">
                <div
                  title={!isOpen ? item.label : undefined}
                  className={clsx(
                    'group relative flex cursor-pointer items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isParentActive
                      ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                  )}
                  onClick={(e) => {
                    if (isOpen) {
                      toggleDropdown(item.id, e);
                    } else {
                      navigate(item.children![0].path);
                      onNavigate?.();
                    }
                  }}
                >
                  <div className="grid h-8 w-8 place-items-center flex-shrink-0">
                    <Icon size={20} />
                  </div>

                  {isOpen && (
                    <>
                      <span className="ml-2 min-w-0 flex-1 truncate">{item.label}</span>
                      <button
                        type="button"
                        onClick={(e) => toggleDropdown(item.id, e)}
                        className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                      >
                        {isDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </>
                  )}
                </div>

                {/* Sub-items khi sidebar mở */}
                {isOpen && isDropdownOpen && (
                  <div className="ml-7 space-y-1 border-l border-[var(--md-sys-color-outline-variant)] pl-3">
                    {item.children?.map((child) => (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          clsx(
                            'block rounded-xl px-3 py-2 text-xs font-medium transition-colors',
                            isActive
                              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold'
                              : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Single item
          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={onNavigate}
              title={!isOpen ? item.label : undefined}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
                )
              }
            >
              <div className="grid h-8 w-8 place-items-center flex-shrink-0">
                <Icon size={20} />
              </div>
              {isOpen && <span className="ml-2 min-w-0 flex-1 truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-[var(--md-sys-color-outline-variant)] p-2">
        <button
          type="button"
          onClick={handleLogout}
          title={!isOpen ? 'Đăng xuất' : undefined}
          className={clsx(
            'flex w-full items-center rounded-2xl px-3 py-2.5 text-sm font-medium text-[var(--md-sys-color-error)] transition-colors hover:bg-[var(--md-sys-color-error-container)]/30',
            !isOpen && 'justify-center'
          )}
        >
          <div className="grid h-8 w-8 place-items-center flex-shrink-0">
            <LogOut size={20} />
          </div>
          {isOpen && <span className="ml-2 truncate font-semibold">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
