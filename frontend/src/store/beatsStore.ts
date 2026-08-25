import { create } from 'zustand';
import { beatsService } from '../services/beats.service';
import type { Beat } from '../types';

/**
 * Каталог битов — данные ТОЛЬКО с нашего Express API (/api/beats),
 * бэкенд сам читает Supabase. Фронт не знает про supabase.co.
 */
interface BeatsState {
  beats: Beat[];
  loading: boolean;
  error: string | null;
  fetchBeats: () => Promise<void>;
  prependBeat: (beat: Beat) => void;
  removeBeat: (id: string) => void;
}

export const useBeatsStore = create<BeatsState>((set) => ({
  beats: [],
  loading: false,
  error: null,

  fetchBeats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await beatsService.getAll();
      set({ beats: response.data ?? [], loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось загрузить каталог';
      console.error('[beats] ошибка загрузки с бэкенда:', message);
      set({ error: message, loading: false });
    }
  },

  prependBeat: (beat) =>
    set((state) => ({
      beats: [beat, ...state.beats.filter((b) => b.id !== beat.id)],
    })),

  removeBeat: (id) =>
    set((state) => ({
      beats: state.beats.filter((b) => b.id !== id),
    })),
}));
