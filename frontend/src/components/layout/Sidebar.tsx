import { useEffect } from 'react';
import type { NavItem } from '../../types';
import { useNavStore, type AppPage } from '../../store/navStore';
import { ThemeToggle } from './ThemeToggle';

const NAV: NavItem[] = [
  { id: 'browse', label: 'Каталог' },
  { id: 'liked', label: 'Избранное' },
  { id: 'uploads', label: 'Мои биты' },
  { id: 'ai', label: 'ИИ' },
];

export function Sidebar() {
  const page = useNavStore((s) => s.page);
  const setPage = useNavStore((s) => s.setPage);

  // Форма загрузки — часть раздела «Мои биты», подсвечиваем его
  const activeId = page === 'upload' ? 'uploads' : page;

  return (
    <aside className="flex w-44 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-elevated)]/70 px-4 py-6 backdrop-blur-sm md:w-52">
      <button
        type="button"
        onClick={() => setPage('browse')}
        className="mb-10 px-2 text-left"
      >
        <p
          className="text-2xl font-normal tracking-tight text-[var(--ink)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Bloop
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">биты легко</p>
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const id = item.id as AppPage;
          const active = id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(id)}
              className={`rounded-md px-2 py-2 text-left text-sm transition-colors ${
                active
                  ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
                  : 'text-[var(--muted)] hover:bg-[var(--hover-soft)] hover:text-[var(--ink)]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-col gap-3 px-0.5">
        <ThemeToggle />
        <p className="px-1.5 text-[11px] text-[var(--muted)]">v0.1</p>
      </div>
    </aside>
  );
}

/** Короткое уведомление сверху контента (успех загрузки и т.д.) */
export function NoticeBanner() {
  const notice = useNavStore((s) => s.notice);
  const setNotice = useNavStore((s) => s.setNotice);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice, setNotice]);

  if (!notice) return null;

  return (
    <div
      className="mx-auto mb-4 max-w-5xl rounded-md bg-[var(--accent-soft)] px-4 py-2.5 text-sm text-[var(--accent)]"
      role="status"
    >
      {notice}
    </div>
  );
}
