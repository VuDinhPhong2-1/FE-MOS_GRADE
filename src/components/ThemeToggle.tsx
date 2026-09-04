import { useTheme } from '@bug-on/m3-expressive';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { mode, setMode, effectiveMode } = useTheme();

  const isDark = effectiveMode === 'dark';

  const toggleTheme = () => {
    const nextMode = isDark ? 'light' : 'dark';
    setMode(nextMode);
    if (typeof document !== 'undefined') {
      if (nextMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      title={`Chế độ hiện tại: ${mode} (${effectiveMode}) - Nhấn để đổi`}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${className}`}
    >
      {isDark ? (
        <Sun size={17} className="text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon size={17} className="text-slate-600 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
