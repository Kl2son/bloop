import type { Request } from 'express';

/**
 * Публичный базовый URL API (без слэша в конце).
 * На Render удобно задать PUBLIC_BASE_URL=https://bloop-avdi.onrender.com
 * или полагаться на RENDER_EXTERNAL_URL / Host запроса.
 */
export function getPublicBaseUrl(req?: Request): string {
  const fromEnv =
    process.env.PUBLIC_BASE_URL?.trim() ||
    process.env.RENDER_EXTERNAL_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  if (req) {
    const proto = (req.get('x-forwarded-proto') || req.protocol || 'https')
      .split(',')[0]
      .trim();
    const host = (req.get('x-forwarded-host') || req.get('host') || '')
      .split(',')[0]
      .trim();
    if (host) {
      return `${proto}://${host}`;
    }
  }

  // Fallback для продакшена Bloop
  return 'https://bloop-avdi.onrender.com';
}

/**
 * Делает абсолютный URL для медиа.
 * "/uploads/audio/x.mp3" → "https://bloop-avdi.onrender.com/uploads/audio/x.mp3"
 * Уже абсолютные (http/https) и внешние ссылки не трогаем.
 */
export function toAbsoluteMediaUrl(url: string, req?: Request): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith('/')) return url;

  return `${getPublicBaseUrl(req)}${url}`;
}
