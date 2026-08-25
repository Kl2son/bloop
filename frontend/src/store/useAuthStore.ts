import { create } from 'zustand';

/**
 * Auth-стор (роли artist | producer | admin).
 *
 * Прямые запросы к *.supabase.co с фронта в РФ часто дают "Failed to fetch"
 * и вешают экран загрузки. Поэтому на старте сеть к Supabase НЕ вызываем —
 * каталог грузится только через Express на Render.
 * Login/session позже проксируем через бэкенд.
 */

export type UserRole = 'artist' | 'producer' | 'admin';

export interface AuthUser {
  id: string;
  email?: string | null;
}

export interface Profile {
  id: string;
  username: string | null;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  initializeAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initializeAuth: async () => {
    if (get().initialized) return;

    set({ loading: true });
    set({
      user: null,
      profile: null,
      loading: false,
      initialized: true,
    });
  },

  signOut: async () => {
    set({ user: null, profile: null });
  },
}));
