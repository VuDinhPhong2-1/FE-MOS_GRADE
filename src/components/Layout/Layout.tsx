import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationBar, NavigationBarItem, Icon } from '@bug-on/m3-expressive';
import Header from './Header';
import Sidebar, { type SidebarNavItem } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  navItems: SidebarNavItem[];
  userName?: string;
}

const Layout = ({ children, navItems, userName }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isPathActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    if (path.startsWith('/assignments')) {
      return location.pathname.startsWith('/assignments');
    }
    if (path === '/grading') {
      return location.pathname.startsWith('/grading') || location.pathname.startsWith('/scores');
    }
    return location.pathname.startsWith(path);
  };

  // Các items chính đưa xuống bottom bar trên mobile (tối đa 5 items)
  const mobileNavItems = navItems.slice(0, 5);

  return (
    <div
      className="flex min-h-screen overflow-hidden bg-m3-surface text-m3-on-surface"
      style={{
        height: '100dvh',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Desktop NavigationRail (Collapsed cố định) */}
      <Sidebar navItems={navItems} />

      {/* Main Content Area */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header fullName={userName} />

        <div
          className="min-h-0 flex-1 overflow-auto px-3 pt-3 sm:px-5 sm:pt-5 pb-24 lg:pb-3"
          style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        >
          {children}
        </div>

        {/* Mobile Bottom Navigation Bar (MD3 Expressive) */}
        <NavigationBar
          variant="flexible"
          shape="sunny"
          elevated
          className="lg:hidden border-t border-m3-outline-variant bg-m3-surface-container shadow-lg"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {mobileNavItems.map((item) => (
            <NavigationBarItem
              key={item.id}
              icon={<Icon name={item.icon} />}
              label={item.label}
              selected={isPathActive(item.path)}
              onClick={() => navigate(item.path)}
              badge={item.badge}
            />
          ))}
        </NavigationBar>
      </main>
    </div>
  );
};

export default Layout;
