import { Icon, IconButton } from '@bug-on/m3-expressive';
import { usePageActionsContext } from '../../context/PageActionsContext';
import { ThemeToggle } from '../common';

interface HeaderProps {
  onOpenProfile?: () => void;
}

const Header = ({ onOpenProfile }: HeaderProps) => {
  const { config } = usePageActionsContext();

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-transparent p-4 transition-colors sm:px-5 min-h-20"
    >
      {/* Left side: Mobile Brand Icon M + Page Title & Subtitle */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile: Chỉ hiển thị icon M thương hiệu */}
        <div className="flex items-center lg:hidden">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-m3-primary text-sm font-extrabold text-m3-on-primary shadow-xs select-none">
            M
          </div>
        </div>

        {/* Page Title & Subtitle */}
        {config.title && (
          <div className="flex min-w-0 flex-col justify-center">
            <h1 className="truncate text-base font-bold tracking-tight text-m3-on-surface sm:text-lg lg:text-xl">
              {config.title}
            </h1>
            {config.subtitle && (
              <p className="hidden truncate text-xs text-m3-on-surface-variant sm:block">
                {config.subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right side: Fixed ThemeToggle + Settings IconButton for both Desktop and Mobile */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ThemeToggle />

        <IconButton
          colorStyle="filled"
          size="md"
          onClick={onOpenProfile}
          aria-label="Cài đặt tài khoản"
          title="Cài đặt tài khoản"
        >
          <Icon name="settings" size={24} variant="rounded" />
        </IconButton>
      </div>
    </header>
  );
};

export default Header;
