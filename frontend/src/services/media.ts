import { API_BASE } from './api';

const BEATS_PUBLIC_MARKER = '/storage/v1/object/public/beats/';

/**
 * Достаёт относительный путь внутри бакета `beats`
 * из полного Supabase URL или уже короткого path.
 *
 * Примеры:
 *   https://xxx.supabase.co/storage/v1/object/public/beats/covers/a.jpg
 *     → covers/a.jpg
 *   covers/a.jpg → covers/a.jpg
 *   audio/track.mp3 → audio/track.mp3
 */
export function extractBucketPath(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  if (trimmed.includes(BEATS_PUBLIC_MARKER)) {
    const after = trimmed.split(BEATS_PUBLIC_MARKER)[1] ?? '';
    return decodeURIComponent(after.split('?')[0] ?? '').replace(/^\/+/, '') || null;
  }

  // Уже относительный путь в бакете
  const relative = trimmed.replace(/^\/+/, '');
  if (/^(audio|covers)\//i.test(relative)) {
    return relative;
  }

  return null;
}

/**
 * URL медиа через reverse-proxy бэкенда.
 *
 * Почему так: прямые ссылки на *.supabase.co у части провайдеров блокируются,
 * из‑за этого зависают обложки и плеер. Бэкенд на Render качает файл сам
 * (сервер → Supabase) и стримит клиенту с /api/media?path=...
 *
 * Внешние демо-URL (SoundHelix, picsum) не трогаем — они не из нашего бакета.
 */
export function mediaUrl(url: string): string {
  if (!url) return url;

  const bucketPath = extractBucketPath(url);
  if (bucketPath) {
    const base = (API_BASE || '').replace(/\/$/, '');
    return `${base}/api/media?path=${encodeURIComponent(bucketPath)}`;
  }

  // Не Supabase Storage — отдаём как есть (или дополняем API_BASE для /uploads)
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const base = (API_BASE || '').replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

/** Загруженный пользователем бит (Supabase Storage или старый /uploads) */
export function isUploadedBeat(beat: { audioUrl: string; coverUrl: string }): boolean {
  const urls = `${beat.audioUrl} ${beat.coverUrl}`;
  return (
    urls.includes('/uploads/') ||
    urls.includes('/storage/v1/object/') ||
    urls.includes('.supabase.co/') ||
    /^(audio|covers)\//.test(beat.audioUrl) ||
    /^(audio|covers)\//.test(beat.coverUrl)
  );
}
