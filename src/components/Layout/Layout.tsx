import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import type { LucideIcon } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  navItems: Array<{ id: string; label: string; icon: LucideIcon; path: string }>;
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
    <div className="min-h-screen bg-gray-100 flex">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={handleCloseSidebarOnMobile}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        navItems={navItems}
        onNavigate={handleCloseSidebarOnMobile}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          fullName={userName}
        />

        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
