import { usePlayerStore } from '../store/playerStore';

/**
 * Тонкая обёртка над Zustand-стором плеера.
 * Компоненты берут отсюда current / play / seek и т.д.,
 * не импортируя стор напрямую — так проще менять API позже
 * (в т.ч. при переносе логики в React Native).
 */
export function usePlayer() {
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const toggle = usePlayerStore((s) => s.toggle);
  const stop = usePlayerStore((s) => s.stop);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);

  return {
    current,
    isPlaying,
    currentTime,
    duration,
    volume,
    play,
    pause,
    toggle,
    stop,
    seek,
    setVolume,
  };
}
