/**
 * Базовый URL бэкенда (Render).
 * Фронтенд ходит ТОЛЬКО сюда — не на *.supabase.co (блокируется у части провайдеров).
 *
 * Приоритет: VITE_BACKEND_URL → VITE_API_URL → '' (dev: Vite proxy /api → localhost:3001)
 */
const API_BASE = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  ''
).replace(/\/$/, '');

export { API_BASE };

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    // Типичный "Failed to fetch" — бэкенд недоступен / CORS / offline
    console.error('[api] сеть недоступна:', url, err);
    throw new ApiError(
      'Не удалось связаться с сервером Bloop. Попробуйте позже.',
      0,
    );
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      (body as { message?: string }).message ?? 'Request failed',
      response.status,
    );
  }

  return body as T;
}
