import { useThemeMode, Icon } from '@bug-on/m3-expressive';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { mode, setMode, effectiveMode } = useThemeMode();
  const isDark = effectiveMode === 'dark';

  return (
    <button
      type="button"
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={`Chế độ: ${mode} (${effectiveMode}) - Bấm để đổi`}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-m3-outline-variant bg-m3-surface-container text-m3-on-surface shadow-xs transition-colors hover:bg-m3-surface-container-high focus:outline-none cursor-pointer ${className}`}
    >
      {isDark ? (
        <Icon name="light_mode" className="text-amber-400 text-lg" />
      ) : (
        <Icon name="dark_mode" className="text-m3-on-surface-variant text-lg" />
      )}
    </button>
  );
}

export default ThemeToggle;
