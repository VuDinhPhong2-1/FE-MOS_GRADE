import type { ReactNode } from 'react';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import type { LucideIcon } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  navItems: Array<{ id: string; label: string; icon: LucideIcon; path: string }>;
  userName?: string;
}

const Layout = ({ children, navItems, userName }: LayoutProps) => {
  console.log("userName", userName)
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar isOpen={sidebarOpen} navItems={navItems} />

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
