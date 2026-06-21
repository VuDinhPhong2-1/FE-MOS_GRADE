import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
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

  return (
    <div
      className="flex min-h-screen overflow-hidden"
      style={{
        height: '100dvh',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Đóng lớp phủ thanh bên"
          onClick={handleCloseSidebarOnMobile}
          className="fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <Sidebar isOpen={sidebarOpen} navItems={navItems} onNavigate={handleCloseSidebarOnMobile} />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} fullName={userName} />
        <div
          className="min-h-0 flex-1 overflow-auto px-3 pt-3 sm:px-5 sm:pt-5"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
