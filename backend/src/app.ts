import cors from 'cors';
import express from 'express';
import aiRoutes from './routes/ai.routes';
import beatsRoutes from './routes/beats.routes';
import searchRoutes from './routes/search.routes';
import { UPLOADS_ROOT } from './middleware/upload';

const app = express();

// CORS нужен: фронт на Vercel ходит к API/медиа на Render
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);
app.use(express.json());

/**
 * Статика загруженных файлов.
 * GET https://bloop-avdi.onrender.com/uploads/audio/….mp3
 * GET https://bloop-avdi.onrender.com/uploads/covers/….jpg
 */
app.use(
  '/uploads',
  express.static(UPLOADS_ROOT, {
    fallthrough: true,
    setHeaders(res) {
      // Картинки и аудио можно кэшировать в браузере
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }),
);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ok' });
});

app.use('/api/beats', beatsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);

export default app;
