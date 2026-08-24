import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../store/playerStore';

/**
 * AudioEngine — единственное место, где живёт HTML5 <audio>.
 *
 * Связка Zustand ↔ <audio>:
 * ┌─────────────────┐         ┌──────────────────┐
 * │  Карточка бита  │ play()  │  playerStore     │
 * │  / кнопка $     │ ──────► │  current,        │
 * └─────────────────┘         │  isPlaying, …    │
 *                             └────────┬─────────┘
 *                                      │ подписка
 *                             ┌────────▼─────────┐
 *                             │  AudioEngine     │
 *                             │  <audio ref />   │  ← реальный звук
 *                             └────────┬─────────┘
 *                                      │ timeupdate
 *                             ┌────────▼─────────┐
 *                             │  setProgress()   │ → шкала в PlayerBar
 *                             └──────────────────┘
 *
 * React не умеет «играть звук» сам по себе: мы управляем DOM-элементом
 * через ref и синхронизируем его с глобальным стейтом в useEffect.
 */
export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Подписки на срезы стора — компонент перерисуется только при их изменении
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const seekTo = usePlayerStore((s) => s.seekTo);

  /**
   * Смена трека: подставляем новый src в <audio>.
   * load() сбрасывает буфер; play() вызываем отдельно в эффекте isPlaying,
   * чтобы не дублировать логику старта.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;

    // Если URL уже тот же — не перезагружаем (например, после паузы)
    if (audio.src === new URL(current.audioUrl, window.location.href).href) {
      return;
    }

    audio.src = current.audioUrl;
    audio.load();
  }, [current]);

  /**
   * Play / Pause по флагу из Zustand.
   * Браузеры требуют user gesture для первого play() — клик по карточке
   * как раз и является таким жестом, поэтому play() здесь безопасен.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;

    if (isPlaying) {
      void audio.play().catch(() => {
        // Автоплей мог быть заблокирован — откатываем флаг в сторе
        usePlayerStore.getState().pause();
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, current]);

  /** Громкость: свойство volume у HTMLMediaElement принимает 0…1 */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  /**
   * Перемотка: ползунок в PlayerBar пишет seekTo в стор,
   * мы применяем его к audio.currentTime и очищаем флаг.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekTo === null) return;

    audio.currentTime = seekTo;
    usePlayerStore.getState().clearSeek();
  }, [seekTo]);

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      // timeupdate ≈ несколько раз в секунду — обновляем шкалу прогресса
      onTimeUpdate={() => {
        const audio = audioRef.current;
        if (!audio) return;
        usePlayerStore
          .getState()
          .setProgress(audio.currentTime, audio.duration || 0);
      }}
      // Когда браузер узнал длительность файла
      onLoadedMetadata={() => {
        const audio = audioRef.current;
        if (!audio) return;
        usePlayerStore
          .getState()
          .setProgress(audio.currentTime, audio.duration || 0);
      }}
      // Конец трека — ставим на паузу и обнуляем позицию
      onEnded={() => {
        usePlayerStore.getState().pause();
        usePlayerStore.getState().seek(0);
      }}
    />
  );
}
