import { API_BASE } from './api';

/**
 * Собирает URL медиа для <img> / <audio>.
 * Абсолютные ссылки (http/https) оставляем как есть.
 * Относительные /uploads/... дополняем API_BASE (Render в проде).
 */
export function mediaUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;

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
    urls.includes('.supabase.co/')
  );
}
