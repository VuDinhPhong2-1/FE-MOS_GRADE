import { useNavigate, useLocation } from 'react-router-dom';
import {
  Icon,
  NavigationRail,
  NavigationRailItem,
  ShapeMedia,
} from '@bug-on/m3-expressive';
import ThemeToggle from '../ThemeToggle';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string | number;
}

interface SidebarProps {
  navItems: SidebarNavItem[];
  onNavigate?: () => void;
}

export const Sidebar = ({ navItems, onNavigate }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <aside className="relative hidden h-full flex-col border-r border-m3-outline-variant bg-m3-surface text-m3-on-surface lg:flex">
      <NavigationRail
        variant="collapsed"
        header={
          <ShapeMedia
            shape="clover4Leaf"
            morphTo="pill"
            morphOn="hover"
            morphOptions={{
              duration: 0.4,
              easing: [0.34, 1.56, 0.64, 1]
            }}
            className="flex size-10 items-center justify-center bg-m3-primary text-m3-on-primary"
          >
            <span className="text-lg font-extrabold">M</span>
          </ShapeMedia>
        }
        footer={
          <div className="flex w-full flex-col items-center justify-center border-t border-m3-outline-variant/60 pt-3 pb-2">
            <ThemeToggle className="h-10 w-10" />
          </div>
        }
        className="h-full bg-m3-surface"
      >
        {navItems.map((item) => (
          <NavigationRailItem
            key={item.id}
            icon={<Icon name={item.icon} />}
            label={item.label}
            selected={isPathActive(item.path)}
            onClick={() => {
              navigate(item.path);
              onNavigate?.();
            }}
            badge={item.badge}
          />
        ))}
      </NavigationRail>
    </aside>
  );
};

export default Sidebar;
