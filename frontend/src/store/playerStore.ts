import { create } from 'zustand';
import type { Beat } from '../types';

/**
 * Глобальный стейт плеера (Zustand).
 *
 * Как данные трека попадают в плеер:
 * 1. Карточка бита вызывает play(beat) / toggle() из этого стора.
 * 2. В current записывается объект Beat (title, author, audioUrl, …).
 * 3. Компоненты PlayerBar и AudioEngine подписаны на стор через
 *    usePlayerStore / usePlayer — React автоматически перерисует их.
 * 4. AudioEngine видит новый current и выставляет его audioUrl
 *    в HTML5 <audio>, после чего запускает воспроизведение.
 *
 * Стор хранит «намерения» (что играть, пауза ли, куда seek, громкость).
 * Сам звук воспроизводит браузерный <audio> в AudioEngine — не Zustand.
 */
interface PlayerState {
  /** Текущий выбранный бит или null, если ничего не выбрано */
  current: Beat | null;
  /** Играет ли трек сейчас (true) или на паузе (false) */
  isPlaying: boolean;
  /** Текущая позиция воспроизведения в секундах */
  currentTime: number;
  /** Длительность трека в секундах (0, пока метаданные не загружены) */
  duration: number;
  /** Громкость от 0 до 1 */
  volume: number;
  /**
   * Запрос на перемотку: AudioEngine читает это значение,
   * ставит audio.currentTime и сбрасывает seekTo обратно в null.
   * Нужно, потому что DOM-элемент <audio> живёт вне Zustand.
   */
  seekTo: number | null;

  play: (beat: Beat) => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  /** Вызывается из AudioEngine при timeupdate / loadedmetadata */
  setProgress: (currentTime: number, duration: number) => void;
  /** Сброс флага перемотки после применения в <audio> */
  clearSeek: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  current: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  seekTo: null,

  /**
   * Клик по карточке / кнопке покупки → трек кладётся в current,
   * isPlaying = true. Если кликнули тот же трек повторно — просто play.
   */
  play: (beat) => {
    const { current } = get();
    const isSameTrack = current?.id === beat.id;

    set({
      current: beat,
      isPlaying: true,
      // Новый трек начинаем с нуля; тот же — позицию не сбрасываем
      ...(isSameTrack ? {} : { currentTime: 0, duration: 0 }),
    });
  },

  pause: () => set({ isPlaying: false }),

  toggle: () => {
    const { current, isPlaying } = get();
    if (!current) return;
    set({ isPlaying: !isPlaying });
  },

  stop: () =>
    set({
      current: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      seekTo: null,
    }),

  /** Пользователь двигает ползунок прогресса → просим AudioEngine перемотать */
  seek: (time) => set({ currentTime: time, seekTo: time }),

  setVolume: (volume) =>
    set({ volume: Math.min(1, Math.max(0, volume)) }),

  setProgress: (currentTime, duration) => set({ currentTime, duration }),

  clearSeek: () => set({ seekTo: null }),
}));
