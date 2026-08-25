import { API_BASE } from './api';

const BEATS_PUBLIC_MARKER = '/storage/v1/object/public/beats/';

/**
 * Вырезает путь внутри бакета из полного Supabase URL.
 * https://xxx.supabase.co/storage/v1/object/public/beats/covers/a.jpg → covers/a.jpg
 */
export function extractBucketPath(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  if (trimmed.includes(BEATS_PUBLIC_MARKER)) {
    const after = trimmed.split(BEATS_PUBLIC_MARKER)[1] ?? '';
    return (
      decodeURIComponent(after.split('?')[0] ?? '').replace(/^\/+/, '') || null
    );
  }

  // Уже относительный путь: covers/... или audio/...
  const relative = trimmed.replace(/^\/+/, '');
  if (/^(audio|covers)\//i.test(relative)) {
    return relative;
  }

  // Вариант path=beats/covers/... — убираем префикс бакета
  if (/^beats\/(audio|covers)\//i.test(relative)) {
    return relative.replace(/^beats\//i, '');
  }

  return null;
}

/**
 * Все медиа только через бэкенд-прокси:
 *   ${VITE_BACKEND_URL}/api/media?path=covers/file.jpg
 *
 * Браузер никогда не ходит на supabase.co — файл качает Render.
 */
export function mediaUrl(url: string): string {
  if (!url) return url;

  const bucketPath = extractBucketPath(url);
  if (bucketPath) {
    return `${API_BASE}/api/media?path=${encodeURIComponent(bucketPath)}`;
  }

  // Внешние демо (SoundHelix и т.п.) — без supabase
  if (/^https?:\/\//i.test(url) && !url.includes('supabase.co')) {
    return url;
  }

  // Любой оставшийся supabase URL — не отдаём напрямую
  if (url.includes('supabase.co')) {
    console.warn('[media] не удалось разобрать path, URL скрыт:', url);
    return `${API_BASE}/api/media?path=`;
  }

  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE}${path}`;
}

export function isUploadedBeat(beat: {
  audioUrl: string;
  coverUrl: string;
}): boolean {
  const urls = `${beat.audioUrl} ${beat.coverUrl}`;
  return (
    urls.includes('/uploads/') ||
    urls.includes('/storage/v1/object/') ||
    urls.includes('.supabase.co/') ||
    /^(audio|covers)\//.test(beat.audioUrl) ||
    /^(audio|covers)\//.test(beat.coverUrl)
  );
}
