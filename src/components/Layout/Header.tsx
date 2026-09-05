import { Icon, Button } from '@bug-on/m3-expressive';
import { usePageActionsContext } from '../../context/PageActionsContext';
import ThemeToggle from '../ThemeToggle';

interface HeaderProps {
  onOpenProfile?: () => void;
}

const Header = ({ onOpenProfile }: HeaderProps) => {
  const { config } = usePageActionsContext();
  const actions = config.actions || [];

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-transparent px-3 py-2 transition-colors sm:px-5"
      style={{
        minHeight: 'calc(3.75rem + env(safe-area-inset-top))',
        paddingTop: 'calc(0.5rem + env(safe-area-inset-top))',
      }}
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

      {/* Right side: Desktop Actions + Mobile ThemeToggle + Mobile Settings Button */}
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Desktop Page Actions Container */}
        {actions.length > 0 && (
          <div className="hidden items-center gap-2 lg:flex">
            {actions.map((act) => (
              <Button
                key={act.id}
                colorStyle={act.colorStyle || act.variant || 'filled'}
                size="sm"
                onClick={act.onClick}
                disabled={act.disabled}
                className={act.className}
              >
                <div className="flex items-center gap-1.5">
                  {act.icon && <Icon name={act.icon} className="text-base" />}
                  <span>{act.label}</span>
                </div>
              </Button>
            ))}
          </div>
        )}

        {/* ThemeToggle: hiển thị ở Header trên mobile, ẩn trên desktop (vì đã có ở Navigation Rail) */}
        <ThemeToggle className="lg:hidden" />

        {/* Mobile Settings: trên desktop đã có nút Settings trong Sidebar, trên mobile hiển thị icon button settings ở Header */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-m3-surface-container text-m3-on-surface-variant shadow-xs transition-colors hover:bg-m3-surface-container-high hover:text-m3-on-surface focus:outline-none cursor-pointer lg:hidden"
          aria-label="Cài đặt tài khoản"
          title="Cài đặt tài khoản"
        >
          <Icon name="settings" className="text-lg" />
        </button>
      </div>
    </header>
  );
};

export default Header;
