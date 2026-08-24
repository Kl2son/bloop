import cors from 'cors';
import express from 'express';
import aiRoutes from './routes/ai.routes';
import beatsRoutes from './routes/beats.routes';
import searchRoutes from './routes/search.routes';
import { UPLOADS_ROOT } from './middleware/upload';

const app = express();

app.use(cors());
app.use(express.json());

// Раздаём сохранённые Multer-файлы: /uploads/audio/… и /uploads/covers/…
app.use('/uploads', express.static(UPLOADS_ROOT));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ok' });
});

app.use('/api/beats', beatsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);

export default app;
