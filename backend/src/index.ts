import app from './app';
// dotenv подключается внутри lib/supabase.ts (.env.production + .env)

/** Render задаёт PORT сам; локально — 3001 */
const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`);
});
