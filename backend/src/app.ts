import cors from 'cors';
import express from 'express';
import aiRoutes from './routes/ai.routes';
import beatsRoutes from './routes/beats.routes';
import searchRoutes from './routes/search.routes';
import { isSupabaseConfigured } from './lib/supabase';

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

app.use('/api/beats', beatsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);

export default app;
