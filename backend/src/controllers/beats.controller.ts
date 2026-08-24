import type { Request, RequestHandler, Response } from 'express';
import { addBeat, findBeatById, listBeats } from '../store/beats.store';

/** Достаёт строковый param из Express (в новых типах может быть string | string[]) */
function paramId(req: Request): string {
  const raw = req.params.id;
  return Array.isArray(raw) ? String(raw[0] ?? '') : String(raw ?? '');
}

export const getBeats: RequestHandler = (_req, res): void => {
  res.json({ success: true, data: listBeats() });
};

export const getBeatById: RequestHandler = (req, res): void => {
  const beat = findBeatById(paramId(req));

  if (!beat) {
    res.status(404).json({ success: false, message: 'Beat not found' });
    return;
  }

  res.json({ success: true, data: beat });
};

/**
 * POST /api/beats/upload
 *
 * Как это работает с Multer и FormData:
 *
 * 1. Фронтенд собирает FormData и кладёт в него:
 *    - текстовые поля: title, price, bpm
 *    - файлы: audio (MP3), cover (JPG/PNG)
 *    Автор пока не передаётся — до авторизации ставим заглушку.
 *    Важно: Content-Type НЕ ставим вручную — браузер сам добавит
 *    multipart/form-data с boundary.
 *
 * 2. Middleware beatUpload (Multer) разбирает multipart-тело:
 *    - файлы сохраняются на диск в /uploads/audio и /uploads/covers
 *    - текстовые поля попадают в req.body (строки!)
 *    - файлы — в req.files как { audio: [...], cover: [...] }
 *
 * 3. Этот контроллер валидирует поля, собирает объект Beat
 *    с публичными URL (/uploads/...) и добавляет его в память.
 *
 * 4. Клиент получает созданный бит и может сразу показать его в ленте.
 */
export const uploadBeat: RequestHandler = (req, res): void => {
  try {
    // Multer кладёт несколько файлов в объект по имени поля формы
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const audioFile = files?.audio?.[0];
    const coverFile = files?.cover?.[0];

    if (!audioFile || !coverFile) {
      res.status(400).json({
        success: false,
        message: 'Нужны оба файла: audio (MP3) и cover (JPG/PNG)',
      });
      return;
    }

    // Текстовые поля из FormData всегда приходят строками.
    // author опционален: после auth возьмём из сессии пользователя.
    const title = String(req.body.title ?? '').trim();
    const author =
      String(req.body.author ?? '').trim() || 'Bloop Artist';
    const price = Number(req.body.price);
    const bpmRaw = req.body.bpm;
    const bpm =
      bpmRaw === undefined || bpmRaw === '' ? undefined : Number(bpmRaw);

    if (!title) {
      res.status(400).json({
        success: false,
        message: 'Укажите название',
      });
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      res.status(400).json({
        success: false,
        message: 'Цена должна быть числом ≥ 0',
      });
      return;
    }

    if (bpm !== undefined && (!Number.isFinite(bpm) || bpm <= 0)) {
      res.status(400).json({
        success: false,
        message: 'BPM должен быть положительным числом',
      });
      return;
    }

    // Публичные URL: Express раздаёт /uploads как статику (см. app.ts)
    const beat = addBeat({
      title,
      author,
      price,
      bpm,
      audioUrl: `/uploads/audio/${audioFile.filename}`,
      coverUrl: `/uploads/covers/${coverFile.filename}`,
    });

    res.status(201).json({
      success: true,
      data: beat,
      message: 'Бит успешно загружен',
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Не удалось загрузить бит';
    res.status(500).json({ success: false, message });
  }
};
