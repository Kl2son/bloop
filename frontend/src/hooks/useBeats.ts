import { useEffect } from 'react';
import { useBeatsStore } from '../store/beatsStore';

/** Хук над beatsStore: при монтировании подгружает каталог с API */
export function useBeats() {
  const beats = useBeatsStore((s) => s.beats);
  const loading = useBeatsStore((s) => s.loading);
  const error = useBeatsStore((s) => s.error);
  const fetchBeats = useBeatsStore((s) => s.fetchBeats);
  const prependBeat = useBeatsStore((s) => s.prependBeat);

  useEffect(() => {
    void fetchBeats();
  }, [fetchBeats]);

  return { beats, loading, error, reload: fetchBeats, prependBeat };
}
