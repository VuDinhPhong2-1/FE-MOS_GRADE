import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import Header from './Header';
import Sidebar, { type SidebarNavItem } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  navItems: SidebarNavItem[];
  userName?: string;
}

const Layout = ({ children, navItems, userName }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });

  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCloseSidebarOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Các items chính đưa xuống bottom bar trên mobile (tối đa 4-5 items)
  const mobileNavItems = navItems.slice(0, 5);

  return (
    <div
      className="flex min-h-screen overflow-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
      style={{
        height: '100dvh',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Backdrop overlay khi mở drawer trên mobile */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Đóng thanh điều hướng"
          onClick={handleCloseSidebarOnMobile}
          className="fixed inset-0 z-30 bg-[var(--md-sys-color-scrim)]/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Desktop NavigationRail & Mobile Drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        navItems={navItems}
        onNavigate={handleCloseSidebarOnMobile}
      />

      {/* Main Content Area */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} fullName={userName} />

        <div
          className="min-h-0 flex-1 overflow-auto px-3 pt-3 sm:px-5 sm:pt-5 pb-20 lg:pb-3"
          style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
        >
          {children}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          aria-label="Thanh điều hướng nhanh"
          className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center justify-around border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] px-2 lg:hidden shadow-lg"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const targetPath = item.children?.length ? item.children[0].path : item.path;
            const isActive =
              location.pathname === item.path ||
              Boolean(item.children?.some((child) => location.pathname.startsWith(child.path)));

            return (
              <NavLink
                key={item.id}
                to={targetPath}
                className={clsx(
                  'flex flex-col items-center justify-center flex-1 py-1 transition-colors',
                  isActive
                    ? 'text-[var(--md-sys-color-primary)] font-semibold'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                )}
              >
                <div
                  className={clsx(
                    'grid h-8 w-14 place-items-center rounded-full transition-all',
                    isActive && 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                  )}
                >
                  <Icon size={19} />
                </div>
                <span className="mt-0.5 max-w-[70px] truncate text-[10px]">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </main>
    </div>
  );
};

export default Layout;
