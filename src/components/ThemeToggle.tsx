import { useThemeMode } from '@bug-on/m3-expressive';
import { Moon, Sun } from 'lucide-react';

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
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] shadow-sm transition-colors hover:bg-[var(--md-sys-color-surface-container-high)] focus:outline-none ${className}`}
    >
      {isDark ? (
        <Sun size={17} className="text-amber-400" />
      ) : (
        <Moon size={17} className="text-slate-600" />
      )}
    </button>
  );
}

export default ThemeToggle;
