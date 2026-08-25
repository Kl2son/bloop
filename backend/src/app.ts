import cors from 'cors';
import express from 'express';
import axios from 'axios';
import aiRoutes from './routes/ai.routes';
import beatsRoutes from './routes/beats.routes';
import searchRoutes from './routes/search.routes';
import { getSupabaseUrl, isSupabaseConfigured } from './lib/supabase';

const app = express();

// CORS нужен: фронт на Vercel ходит к API на Render
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'ok',
    supabase: isSupabaseConfigured(),
  });
});

/**
 * GET /api/media?path=covers/image.jpg
 *
 * Reverse-proxy медиа из Supabase Storage через наш бэкенд.
 * Браузер пользователя НЕ ходит на supabase.co напрямую (обход блокировок провайдера):
 *   клиент → Render /api/media → Supabase Storage → stream pipe обратно клиенту.
 *
 * path — относительный путь внутри публичного бакета `beats`
 * (например audio/123.mp3 или covers/cover.jpg).
 */
app.get('/api/media', async (req, res) => {
  try {
    const raw =
      typeof req.query.path === 'string'
        ? req.query.path
        : Array.isArray(req.query.path)
          ? String(req.query.path[0] ?? '')
          : '';

    // Нормализация + защита от path traversal
    const objectPath = decodeURIComponent(raw)
      .replace(/^\/+/, '')
      .replace(/\\/g, '/');

    if (
      !objectPath ||
      objectPath.includes('..') ||
      objectPath.includes('\0')
    ) {
      res.status(400).json({ success: false, message: 'Invalid media path' });
      return;
    }

    const supabaseBase = getSupabaseUrl();
    if (!supabaseBase) {
      res.status(503).json({
        success: false,
        message: 'SUPABASE_URL не настроен',
      });
      return;
    }

    // Публичный объект: /storage/v1/object/public/<bucket>/<path>
    const supabaseFileUrl = `${supabaseBase}/storage/v1/object/public/beats/${objectPath}`;

    const upstream = await axios.get(supabaseFileUrl, {
      responseType: 'stream',
      timeout: 60_000,
      // Сами решаем, что делать с 4xx/5xx от Storage
      validateStatus: () => true,
    });

    if (upstream.status >= 400) {
      // Не стримим HTML/JSON ошибки Storage клиенту как медиа
      upstream.data?.destroy?.();
      const status = upstream.status === 404 ? 404 : 502;
      res.status(status).json({
        success: false,
        message:
          upstream.status === 404
            ? 'Файл не найден в Storage'
            : `Storage error: ${upstream.status}`,
      });
      return;
    }

    // Проброс Content-Type (audio/mpeg, image/jpeg и т.д.)
    const contentType = upstream.headers['content-type'];
    if (typeof contentType === 'string') {
      res.setHeader('Content-Type', contentType);
    }

    const contentLength = upstream.headers['content-length'];
    if (typeof contentLength === 'string') {
      res.setHeader('Content-Length', contentLength);
    }

    // Кэш на CDN/браузере — медиа почти immutable
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Стриминг без буферизации всего файла в RAM
    upstream.data.pipe(res);

    upstream.data.on('error', (err: Error) => {
      console.error('[media] stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Stream failed' });
      } else {
        res.destroy(err);
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Media proxy failed';
    console.error('[media]', message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message });
    }
  }
});

app.use('/api/beats', beatsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);

export default app;
