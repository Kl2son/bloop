import multer from 'multer';

/**
 * Multer в режиме memoryStorage:
 * файлы НЕ пишутся на диск Render, а остаются в req.file.buffer.
 * Дальше контроллер отправляет buffer в Supabase Storage.
 *
 * Так перезапуск сервера не теряет медиа — они уже в облаке.
 */

function uniqueName(originalName: string): string {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${safe}`;
}

function fileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (file.fieldname === 'audio') {
    const ok =
      file.mimetype === 'audio/mpeg' ||
      file.mimetype === 'audio/mp3' ||
      file.originalname.toLowerCase().endsWith('.mp3') ||
      file.originalname.toLowerCase().endsWith('.wav') ||
      file.mimetype === 'audio/wav' ||
      file.mimetype === 'audio/x-wav' ||
      file.mimetype === 'audio/wave';
    if (!ok) {
      cb(new Error('Аудио должно быть MP3 или WAV'));
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

export const beatUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
}).fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);

export { uniqueName };
