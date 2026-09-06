import { useThemeMode, Icon, IconButton } from '@bug-on/m3-expressive';

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode, effectiveMode } = useThemeMode();
  const isDark = effectiveMode === 'dark';

  return (
    <IconButton
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={`Chế độ: ${mode} (${effectiveMode}) - Bấm để đổi`}
      size='md'
      className={className}
    >
      {isDark ? (
        <Icon name="light_mode" size={24} variant='rounded' />
      ) : (
        <Icon name="dark_mode" size={24} variant='rounded' />
      )}
    </IconButton>
  );
}

export default ThemeToggle;
