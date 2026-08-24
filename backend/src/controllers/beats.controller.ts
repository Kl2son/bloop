import fs from 'fs';
import path from 'path';
import type { Request, RequestHandler } from 'express';
import {
  addBeat,
  findBeatById,
  listBeats,
  removeBeatById,
} from '../store/beats.store';
import type { Beat } from '../types';
import { AUDIO_DIR, COVER_DIR } from '../middleware/upload';
import { toAbsoluteMediaUrl } from '../utils/publicUrl';

/** Достаёт строковый param из Express (в новых типах может быть string | string[]) */
function paramId(req: Request): string {
  const raw = req.params.id;
  return Array.isArray(raw) ? String(raw[0] ?? '') : String(raw ?? '');
}

/** Относительные /uploads → абсолютный URL бэкенда (Vercel иначе ищет файл у себя) */
function withAbsoluteMedia(beat: Beat, req: Request): Beat {
  return {
    ...beat,
    audioUrl: toAbsoluteMediaUrl(beat.audioUrl, req),
    coverUrl: toAbsoluteMediaUrl(beat.coverUrl, req),
  };
}

export const getBeats: RequestHandler = (req, res): void => {
  res.json({
    success: true,
    data: listBeats().map((beat) => withAbsoluteMedia(beat, req)),
  });
};

export const getBeatById: RequestHandler = (req, res): void => {
  const beat = findBeatById(paramId(req));

  if (!beat) {
    res.status(404).json({ success: false, message: 'Beat not found' });
    return;
  }

  res.json({ success: true, data: withAbsoluteMedia(beat, req) });
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
 *    с абсолютными URL на этот сервер и добавляет его в память.
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

    // В памяти храним относительные пути; в ответе клиенту — абсолютные
    const relativeAudio = `/uploads/audio/${audioFile.filename}`;
    const relativeCover = `/uploads/covers/${coverFile.filename}`;

    const beat = addBeat({
      title,
      author,
      price,
      bpm,
      audioUrl: relativeAudio,
      coverUrl: relativeCover,
    });

    res.status(201).json({
      success: true,
      data: withAbsoluteMedia(beat, req),
      message: 'Бит успешно загружен',
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Не удалось загрузить бит';
    res.status(500).json({ success: false, message });
  }
};

/**
 * Извлекает имя файла только из наших /uploads/... путей.
 * Внешние URL (SoundHelix и т.п.) не трогаем — там нечего удалять с диска.
 */
function localUploadFilename(mediaUrl: string, kind: 'audio' | 'cover'): string | null {
  try {
    const pathname = /^https?:\/\//i.test(mediaUrl)
      ? new URL(mediaUrl).pathname
      : mediaUrl;
    const prefix = kind === 'audio' ? '/uploads/audio/' : '/uploads/covers/';
    if (!pathname.startsWith(prefix)) return null;
    const name = path.basename(pathname);
    // Защита от path traversal: basename уже отбрасывает "../"
    if (!name || name === '.' || name === '..') return null;
    return name;
  } catch {
    return null;
  }
}

/**
 * Удаляет файл с диска через fs.unlink.
 *
 * fs.unlink(path, callback) — асинхронно стирает файл по абсолютному пути.
 * Если файла уже нет (ENOENT) — это не ошибка для нашего сценария:
 * запись из памяти всё равно удаляем. Другие ошибки логируем, но
 * ответ клиенту не блокируем.
 */
function unlinkUploadFile(absolutePath: string): void {
  fs.unlink(absolutePath, (err) => {
    if (!err) return;
    // ENOENT = файла нет — возможно, уже удалили вручную
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
    console.error('Не удалось удалить файл:', absolutePath, err.message);
  });
}

/**
 * DELETE /api/beats/:id
 * Удаляет бит из in-memory каталога и физические mp3/jpg из /uploads.
 */
export const deleteBeat: RequestHandler = (req, res): void => {
  const id = paramId(req);
  const removed = removeBeatById(id);

  if (!removed) {
    res.status(404).json({ success: false, message: 'Beat not found' });
    return;
  }

  const audioName = localUploadFilename(removed.audioUrl, 'audio');
  const coverName = localUploadFilename(removed.coverUrl, 'cover');

  // fs.unlink стирает файл с диска; путь собираем только внутри AUDIO_DIR / COVER_DIR
  if (audioName) {
    unlinkUploadFile(path.join(AUDIO_DIR, audioName));
  }
  if (coverName) {
    unlinkUploadFile(path.join(COVER_DIR, coverName));
  }

  res.json({
    success: true,
    data: { id },
    message: 'Бит удалён',
  });
};
