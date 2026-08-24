import { create } from 'zustand';
import { beatsService } from '../services/beats.service';
import type { Beat } from '../types';

/**
 * Каталог битов в Zustand — чтобы после upload новый трек
 * сразу попал в ленту без обязательного полного рефетча.
 */
interface BeatsState {
  beats: Beat[];
  loading: boolean;
  error: string | null;
  fetchBeats: () => Promise<void>;
  /** Добавить только что загруженный бит в начало ленты */
  prependBeat: (beat: Beat) => void;
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
      set({
        error: err instanceof Error ? err.message : 'Failed to load beats',
        loading: false,
      });
    }
  },

  prependBeat: (beat) =>
    set((state) => ({
      beats: [beat, ...state.beats.filter((b) => b.id !== beat.id)],
    })),
}));
