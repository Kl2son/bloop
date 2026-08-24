import { useEffect } from 'react';
import { TrackCard } from '../tracks/TrackCard';
import { useBeatsStore } from '../../store/beatsStore';
import { useNavStore } from '../../store/navStore';

/** Загруженные пользователем биты — файлы лежат в /uploads */
function isUploadedBeat(audioUrl: string, coverUrl: string): boolean {
  return audioUrl.startsWith('/uploads') || coverUrl.startsWith('/uploads');
}

/**
 * Раздел «Мои биты»: список загруженных треков
 * и кнопка перехода к форме добавления.
 */
export function MyBeatsPage() {
  const beats = useBeatsStore((s) => s.beats);
  const loading = useBeatsStore((s) => s.loading);
  const fetchBeats = useBeatsStore((s) => s.fetchBeats);
  const setPage = useNavStore((s) => s.setPage);

  const myBeats = beats.filter((b) => isUploadedBeat(b.audioUrl, b.coverUrl));

  useEffect(() => {
    void fetchBeats();
  }, [fetchBeats]);

  return (
    <section className="mx-auto max-w-5xl px-5 pb-8 md:px-8 md:pb-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Мои биты
          </h1>
          <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
            Ваши загруженные треки.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPage('upload')}
          className="rounded-md bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85"
        >
          Добавить бит
        </button>
      </header>

      {loading && myBeats.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Загрузка…</p>
      ) : myBeats.length === 0 ? (
        <div className="flex flex-col items-start gap-4 py-6">
          <p className="text-sm text-[var(--muted)]">Пока пусто — загрузите первый бит.</p>
          <button
            type="button"
            onClick={() => setPage('upload')}
            className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
          >
            Добавить бит
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {myBeats.map((beat) => (
            <TrackCard key={beat.id} beat={beat} />
          ))}
        </div>
      )}
    </section>
  );
}
