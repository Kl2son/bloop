import { useThemeStore } from '../../store/themeStore';

/** Компактный переключатель светлая / тёмная тема */
export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div
      className="flex rounded-md border border-[var(--line)] p-0.5"
      role="group"
      aria-label="Тема оформления"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex-1 rounded px-2 py-1 text-[11px] transition-colors ${
          theme === 'light'
            ? 'bg-[var(--ink)] text-[var(--bg-elevated)]'
            : 'text-[var(--muted)] hover:text-[var(--ink)]'
        }`}
        aria-pressed={theme === 'light'}
      >
        Светлая
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex-1 rounded px-2 py-1 text-[11px] transition-colors ${
          theme === 'dark'
            ? 'bg-[var(--ink)] text-[var(--bg-elevated)]'
            : 'text-[var(--muted)] hover:text-[var(--ink)]'
        }`}
        aria-pressed={theme === 'dark'}
      >
        Тёмная
      </button>
    </div>
  );
}
