import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Загрузка env:
 * 1) .env.production — продакшен-ключи (локально / если файл есть на сервере)
 * 2) .env — локальная разработка
 * На Render переменные задаются в Dashboard и уже есть в process.env;
 * dotenv их НЕ перезаписывает (override: false по умолчанию).
 */
dotenv.config({ path: '.env.production' });
dotenv.config();

/**
 * Клиент Supabase — единая точка входа в облако.
 *
 * ─── Как это устроено ───
 * Supabase = PostgreSQL (таблицы) + Storage (файлы) + API-шлюз.
 * createClient(url, key) создаёт SDK, который по HTTPS ходит в:
 *   • .from('beats')           → CRUD по таблице PostgreSQL
 *   • .storage.from('beats')   → upload / remove / getPublicUrl файлов
 *
 * SUPABASE_URL  — адрес проекта (https://….supabase.co)
 * SUPABASE_KEY  — API-ключ. Для бэкенда предпочтителен service_role (secret).
 *                 Publishable-ключ тоже работает, если в SQL открыты политики
 *                 на INSERT/DELETE и upload в бакет (см. schema.sql).
 *
 * Важно: ключ с правами записи держите только на сервере (Render env),
 * никогда не кладите его во фронтенд и не коммитьте в публичный репозиторий.
 */

const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
const supabaseKey = process.env.SUPABASE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[supabase] SUPABASE_URL / SUPABASE_KEY не заданы. ' +
      'См. backend/.env.production и Environment на Render.',
  );
} else {
  console.log(`[supabase] подключение к ${supabaseUrl}`);
}

/** Публичный бакет Storage для mp3/wav и обложек */
export const BEATS_BUCKET = 'beats';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase не настроен: укажите SUPABASE_URL и SUPABASE_KEY',
    );
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}
