import app from './app';

/** Render задаёт PORT сам; локально — 3001 */
const PORT = Number(process.env.PORT) || 3001;

// 0.0.0.0 — чтобы сервис был доступен снаружи контейнера Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`);
});
