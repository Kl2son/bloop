import fs from 'fs';
import path from 'path';
import multer from 'multer';

/**
 * Multer — middleware для приёма multipart/form-data (файлы + текстовые поля).
 *
 * Браузер шлёт FormData; Express сам по себе не разбирает бинарные части.
 * Multer:
 * 1) читает поток запроса,
 * 2) сохраняет файлы на диск (diskStorage),
 * 3) кладёт текстовые поля в req.body,
 * 4) кладёт файлы в req.files.
 */

/**
 * Корень загрузок: process.cwd() — папка backend на Render (Root Directory),
 * а не относительный путь от dist/middleware (ломается при другом layout).
 */
const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');
const AUDIO_DIR = path.join(UPLOADS_ROOT, 'audio');
const COVER_DIR = path.join(UPLOADS_ROOT, 'covers');

// Гарантируем, что папки существуют при старте сервера
for (const dir of [UPLOADS_ROOT, AUDIO_DIR, COVER_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export { UPLOADS_ROOT, AUDIO_DIR, COVER_DIR };

/** Уникальное имя файла: timestamp + безопасный оригинал */
function uniqueName(originalName: string): string {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${safe}`;
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Поле формы "audio" → /uploads/audio, "cover" → /uploads/covers
    if (file.fieldname === 'audio') {
      cb(null, AUDIO_DIR);
      return;
    }
    if (file.fieldname === 'cover') {
      cb(null, COVER_DIR);
      return;
    }
    cb(new Error(`Unknown upload field: ${file.fieldname}`), UPLOADS_ROOT);
  },
  filename(_req, file, cb) {
    cb(null, uniqueName(file.originalname));
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (file.fieldname === 'audio') {
    const ok =
      file.mimetype === 'audio/mpeg' ||
      file.mimetype === 'audio/mp3' ||
      file.originalname.toLowerCase().endsWith('.mp3');
    if (!ok) {
      cb(new Error('Аудио должно быть в формате MP3'));
      return;
    }
    cb(null, true);
    return;
  }

  if (file.fieldname === 'cover') {
    const ok =
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      /\.(jpe?g|png)$/i.test(file.originalname);
    if (!ok) {
      cb(new Error('Обложка должна быть JPG или PNG'));
      return;
    }
    cb(null, true);
    return;
  }

  cb(new Error(`Unknown field: ${file.fieldname}`));
}

/**
 * Ожидаем ровно два файла из формы:
 * - audio — MP3 бита
 * - cover — JPG/PNG обложка
 * Текстовые поля (title, author, price, bpm) придут в req.body.
 */
export const beatUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB на файл
  },
}).fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);
