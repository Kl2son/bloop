import type { Request, RequestHandler } from 'express';
import {
  deleteBeatById,
  findBeatById,
  insertBeat,
  listBeats,
  uploadMediaFile,
} from '../store/beats.store';
import { uniqueName } from '../middleware/upload';
import { isSupabaseConfigured } from '../lib/supabase';

/** Достаёт строковый param из Express (в новых типах может быть string | string[]) */
function paramId(req: Request): string {
  const raw = req.params.id;
  return Array.isArray(raw) ? String(raw[0] ?? '') : String(raw ?? '');
}

export const getBeats: RequestHandler = async (_req, res): Promise<void> => {
  try {
    if (!isSupabaseConfigured()) {
      res.status(503).json({
        success: false,
        message: 'Supabase не настроен (SUPABASE_URL / SUPABASE_KEY)',
      });
      return;
    }

    const beats = await listBeats();
    res.json({ success: true, data: beats });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка чтения каталога';
    res.status(500).json({ success: false, message });
  }
};

export const getBeatById: RequestHandler = async (req, res): Promise<void> => {
  try {
    const beat = await findBeatById(paramId(req));

    if (!beat) {
      res.status(404).json({ success: false, message: 'Beat not found' });
      return;
    }

    res.json({ success: true, data: beat });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка чтения бита';
    res.status(500).json({ success: false, message });
  }
};

/**
 * POST /api/beats/upload
 *
 * Цепочка с Supabase (без локальной папки /uploads):
 *
 * 1. Multer (memoryStorage) держит MP3/WAV и обложку в buffer в RAM процесса.
 * 2. uploadMediaFile() → Storage.from('beats').upload(...)
 *    Файл уходит в облачный бакет; получаем постоянный public URL.
 * 3. insertBeat() → from('beats').insert({ title, artist, price, bpm, audio_url, … })
 *    Метаданные пишутся в PostgreSQL и переживают рестарт Render.
 * 4. Ответ клиенту содержит готовые https://….supabase.co/storage/... ссылки.
 */
export const uploadBeat: RequestHandler = async (req, res): Promise<void> => {
  try {
    if (!isSupabaseConfigured()) {
      res.status(503).json({
        success: false,
        message: 'Supabase не настроен (SUPABASE_URL / SUPABASE_KEY)',
      });
      return;
    }

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const audioFile = files?.audio?.[0];
    const coverFile = files?.cover?.[0];

    if (!audioFile?.buffer || !coverFile?.buffer) {
      res.status(400).json({
        success: false,
        message: 'Нужны оба файла: audio (MP3/WAV) и cover (JPG/PNG)',
      });
      return;
    }

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

    const audioName = uniqueName(audioFile.originalname);
    const coverName = uniqueName(coverFile.originalname);

    // 1) Файлы → облачный бакет Storage
    const audio = await uploadMediaFile(
      'audio',
      audioName,
      audioFile.buffer,
      audioFile.mimetype || 'audio/mpeg',
    );
    const cover = await uploadMediaFile(
      'covers',
      coverName,
      coverFile.buffer,
      coverFile.mimetype || 'image/jpeg',
    );

    // 2) Метаданные → таблица PostgreSQL
    const beat = await insertBeat({
      title,
      author,
      price,
      bpm,
      audioUrl: audio.publicUrl,
      coverUrl: cover.publicUrl,
      audioPath: audio.path,
      coverPath: cover.path,
    });

    res.status(201).json({
      success: true,
      data: beat,
      message: 'Бит успешно загружен в облако',
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Не удалось загрузить бит';
    res.status(500).json({ success: false, message });
  }
};

/**
 * DELETE /api/beats/:id
 *
 * 1. Читаем запись (нужны audio_path / cover_path).
 * 2. storage.from('beats').remove([...]) — стирает объекты в облаке.
 * 3. DELETE FROM beats WHERE id = … — убирает строку из PostgreSQL.
 */
export const deleteBeat: RequestHandler = async (req, res): Promise<void> => {
  try {
    if (!isSupabaseConfigured()) {
      res.status(503).json({
        success: false,
        message: 'Supabase не настроен (SUPABASE_URL / SUPABASE_KEY)',
      });
      return;
    }

    const id = paramId(req);
    const removed = await deleteBeatById(id);

    if (!removed) {
      res.status(404).json({ success: false, message: 'Beat not found' });
      return;
    }

    res.json({
      success: true,
      data: { id },
      message: 'Бит удалён из базы и облачного хранилища',
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Не удалось удалить бит';
    res.status(500).json({ success: false, message });
  }
};
