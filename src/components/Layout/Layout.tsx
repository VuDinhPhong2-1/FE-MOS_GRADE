import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationBar, NavigationBarItem, Icon, FABMenu } from '@bug-on/m3-expressive';
import Header from './Header';
import Sidebar, { type SidebarNavItem } from './Sidebar';
import ProfileModal from './ProfileModal';
import { usePageActionsContext } from '../../context/PageActionsContext';

interface LayoutProps {
  children: ReactNode;
  navItems: SidebarNavItem[];
}

const Layout = ({ children, navItems }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { config } = usePageActionsContext();
  const actions = config.actions || [];

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

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
      className="flex min-h-screen overflow-hidden bg-m3-surface-container-low text-m3-on-surface"
      style={{
        height: '100dvh',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Desktop NavigationRail (Collapsed cố định) */}
      <Sidebar
        navItems={navItems}
        onOpenSettings={() => setIsProfileOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden relative">
        <Header
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* Khung hiển thị nội dung chính - Bo tròn rounded-3xl, scroll bên trong */}
        <div className="min-h-0 flex-1 px-2.5 sm:px-4 lg:pl-0 lg:pr-5 pb-2.5 sm:pb-4 lg:pb-5 pt-1 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 rounded-3xl bg-m3-surface-container-lowest dark:bg-m3-surface text-m3-on-surface overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-36 sm:pb-40 lg:pb-8">
              {children}
            </div>
          </div>
        </div>

        {/* Mobile FAB Menu: Chỉ hiển thị khi có action và trên mobile/tablet (lg:hidden) */}
        {actions.length > 0 && (
          <div className="fixed bottom-20 right-4 z-40 lg:hidden">
            <FABMenu
              expanded={fabOpen}
              onToggle={setFabOpen}
              items={actions.map((act) => ({
                id: act.id,
                label: act.label,
                icon: act.icon ? <Icon name={act.icon} /> : <Icon name="circle" />,
                onClick: () => {
                  setFabOpen(false);
                  act.onClick();
                },
                disabled: act.disabled,
              }))}
              aria-label="Tùy chọn tác vụ trang"
              colorVariant="primary"
              alignment="end"
            />
          </div>
        )}

        {/* Mobile Bottom Navigation Bar (MD3 Expressive) */}
        <NavigationBar
          variant="flexible"
          elevated
          className="lg:hidden bg-m3-surface-container shadow-lg"
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

      {/* Profile Modal dùng chung cho cả Sidebar và Header */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export default Layout;
