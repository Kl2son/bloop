import { useEffect } from 'react';
import { useBeatsStore } from '../../store/beatsStore';
import { TrackCard } from './TrackCard';

export function TrackFeed() {
  const beats = useBeatsStore((s) => s.beats);
  const loading = useBeatsStore((s) => s.loading);
  const error = useBeatsStore((s) => s.error);
  const fetchBeats = useBeatsStore((s) => s.fetchBeats);

  useEffect(() => {
    void fetchBeats();
  }, [fetchBeats]);

  if (loading && beats.length === 0) {
    return (
      <div className="flex h-40 items-center text-sm text-[var(--muted)]">
        Загрузка…
      </div>
    );
  }

  if (error && beats.length === 0) {
    return (
      <div className="flex h-40 items-center text-sm text-red-700/80">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
      {beats.map((beat) => (
        <TrackCard key={beat.id} beat={beat} />
      ))}
    </div>
  );
}
