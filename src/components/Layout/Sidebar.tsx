import { useNavigate, useLocation } from 'react-router-dom';
import {
  Icon,
  NavigationRail,
  NavigationRailItem,
  ShapeMedia,
  Text,
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
  onOpenSettings?: () => void;
}

export const Sidebar = ({ navItems, onNavigate, onOpenSettings }: SidebarProps) => {
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
    <aside className="relative hidden h-full flex-col bg-m3-surface-container-low text-m3-on-surface lg:flex">
      <NavigationRail
        variant="collapsed"
        header={
          <ShapeMedia
            shape="clover4Leaf"
            morphTo="pill"
            morphOn="hover"
            morphOptions={{
              duration: 0.4,
              easing: [0.34, 1.56, 0.64, 1],
            }}
            className="flex size-14 items-center justify-center bg-m3-primary"
          >
            <Text variant="title-lg" className="font-extrabold text-m3-on-primary">
              M
            </Text>
          </ShapeMedia>
        }
        footer={
          <div className="flex w-full flex-col items-center justify-center gap-2 pt-3 pb-2">
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex h-10 w-10 items-center justify-center rounded-full text-m3-on-surface-variant transition-colors hover:bg-m3-surface-container-high hover:text-m3-on-surface"
              aria-label="Cài đặt tài khoản"
              title="Cài đặt tài khoản"
            >
              <Icon name="settings" className="text-xl" />
            </button>
            <ThemeToggle className="h-10 w-10" />
          </div>
        }
        className="h-full bg-m3-surface-container-low"
      >
        {navItems.map((item) => (
          <NavigationRailItem
            key={item.id}
            icon={<Icon name={item.icon} variant="rounded" animateFill />}
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
