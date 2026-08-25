import { create } from 'zustand';
import { createClient, type Session, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[auth] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY не заданы',
  );
}

/** Клиент Auth + чтение profiles (anon key — безопасно для браузера) */
export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export type UserRole = 'artist' | 'producer' | 'admin';

export interface Profile {
  id: string;
  username: string | null;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  initializeAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

function parseRole(value: unknown): UserRole {
  if (value === 'artist' || value === 'producer' || value === 'admin') {
    return value;
  }
  return 'artist';
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[auth] profiles:', error.message);
    return null;
  }

  if (!data) return null;

  return {
    id: String(data.id),
    username: data.username ?? null,
    role: parseRole(data.role),
  };
}

let authListenerBound = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initializeAuth: async () => {
    if (get().initialized) return;

    set({ loading: true });

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[auth] getSession:', error.message);
      }

      const session: Session | null = data.session ?? null;
      const user = session?.user ?? null;

      if (user) {
        const profile = await fetchProfile(user.id);
        set({ user, profile, loading: false, initialized: true });
      } else {
        set({ user: null, profile: null, loading: false, initialized: true });
      }
    } catch (err) {
      console.error('[auth] initializeAuth:', err);
      set({ user: null, profile: null, loading: false, initialized: true });
    }

    if (!authListenerBound) {
      authListenerBound = true;

      supabase.auth.onAuthStateChange((_event, session) => {
        void (async () => {
          const user = session?.user ?? null;

          if (!user) {
            set({ user: null, profile: null });
            return;
          }

          const profile = await fetchProfile(user.id);
          set({ user, profile });
        })();
      });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
