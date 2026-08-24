import { create } from 'zustand';

export type AppPage = 'browse' | 'upload' | 'liked' | 'uploads' | 'ai';

interface NavState {
  page: AppPage;
  /** Короткое уведомление (успех загрузки и т.п.) */
  notice: string | null;
  setPage: (page: AppPage) => void;
  setNotice: (notice: string | null) => void;
}

export const useNavStore = create<NavState>((set) => ({
  page: 'browse',
  notice: null,
  setPage: (page) => set({ page }),
  setNotice: (notice) => set({ notice }),
}));
