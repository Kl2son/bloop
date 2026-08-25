import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { CatalogHero } from './components/catalog/CatalogHero';
import { MyBeatsPage } from './components/beats/MyBeatsPage';
import { TrackFeed } from './components/tracks/TrackFeed';
import { UploadBeatPage } from './components/upload/UploadBeatPage';
import { useNavStore } from './store/navStore';
import { useAuthStore } from './store/useAuthStore';

function CatalogPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 pb-8 md:px-8 md:pb-10">
      <CatalogHero />
      <TrackFeed />
    </section>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-8 md:px-8">
      <h1
        className="text-3xl font-bold tracking-tight text-[var(--ink)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Скоро</p>
    </section>
  );
}

function AuthLoader() {
  return (
    <div className="flex h-full min-h-svh items-center justify-center bg-zinc-950">
      <p
        className="animate-pulse text-sm font-medium tracking-[0.35em] text-zinc-100"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        BLOOP...
      </p>
    </div>
  );
}

export default function App() {
  const page = useNavStore((s) => s.page);
  const loading = useAuthStore((s) => s.loading);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  if (loading) {
    return <AuthLoader />;
  }

  let content = <CatalogPage />;
  if (page === 'upload') content = <UploadBeatPage />;
  else if (page === 'uploads') content = <MyBeatsPage />;
  else if (page === 'liked') content = <PlaceholderPage title="Избранное" />;
  else if (page === 'ai') content = <PlaceholderPage title="ИИ" />;

  return <MainLayout>{content}</MainLayout>;
}
