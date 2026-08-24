import type { Beat } from '../types';
import { BEATS_BUCKET, getSupabase } from '../lib/supabase';

/**
 * Строка таблицы public.beats (PostgreSQL в Supabase).
 * В БД колонка называется artist; в JSON API отдаём author (совместимость с фронтом).
 */
export interface BeatRow {
  id: string;
  title: string;
  artist: string;
  price: number;
  bpm: number | null;
  audio_url: string;
  cover_url: string;
  /** Путь в бакете: audio/….mp3 — нужен для storage.remove() */
  audio_path: string | null;
  cover_path: string | null;
  mood: string | null;
  key: string | null;
  tags: string[] | null;
  created_at?: string;
}

export function rowToBeat(row: BeatRow): Beat {
  return {
    id: String(row.id),
    title: row.title,
    author: row.artist,
    price: Number(row.price),
    bpm: row.bpm ?? undefined,
    mood: row.mood ?? undefined,
    key: row.key ?? undefined,
    tags: row.tags ?? undefined,
    audioUrl: row.audio_url,
    coverUrl: row.cover_url,
    audioPath: row.audio_path ?? undefined,
    coverPath: row.cover_path ?? undefined,
  };
}

/** SELECT * FROM beats ORDER BY created_at DESC */
export async function listBeats(): Promise<Beat[]> {
  const { data, error } = await getSupabase()
    .from('beats')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Не удалось прочитать beats: ${error.message}`);
  }

  return (data as BeatRow[]).map(rowToBeat);
}

export async function findBeatById(id: string): Promise<Beat | undefined> {
  const { data, error } = await getSupabase()
    .from('beats')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Не удалось найти бит: ${error.message}`);
  }

  return data ? rowToBeat(data as BeatRow) : undefined;
}

export type CreateBeatInput = {
  title: string;
  author: string;
  price: number;
  bpm?: number;
  mood?: string;
  key?: string;
  tags?: string[];
  audioUrl: string;
  coverUrl: string;
  audioPath: string;
  coverPath: string;
};

/**
 * INSERT в PostgreSQL через PostgREST.
 * Supabase сам генерирует id (uuid) и created_at на стороне БД.
 */
export async function insertBeat(input: CreateBeatInput): Promise<Beat> {
  const { data, error } = await getSupabase()
    .from('beats')
    .insert({
      title: input.title,
      artist: input.author,
      price: input.price,
      bpm: input.bpm ?? null,
      mood: input.mood ?? null,
      key: input.key ?? null,
      tags: input.tags ?? [],
      audio_url: input.audioUrl,
      cover_url: input.coverUrl,
      audio_path: input.audioPath,
      cover_path: input.coverPath,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Не удалось сохранить бит в БД: ${error.message}`);
  }

  return rowToBeat(data as BeatRow);
}

/**
 * Удаление бита:
 * 1) читаем audio_path / cover_path
 * 2) Storage.remove — физически стирает объекты в бакете `beats`
 * 3) DELETE FROM beats — убирает строку из PostgreSQL
 */
export async function deleteBeatById(id: string): Promise<Beat | undefined> {
  const existing = await findBeatById(id);
  if (!existing) return undefined;

  const paths = [existing.audioPath, existing.coverPath].filter(
    (p): p is string => Boolean(p),
  );

  if (paths.length > 0) {
    /**
     * storage.from('beats').remove(['audio/x.mp3', 'covers/y.jpg'])
     * — пакетное удаление объектов в облачном бакете.
     * Без этого шага файлы остались бы «сиротами» и занимали квоту.
     */
    const { error: storageError } = await getSupabase()
      .storage.from(BEATS_BUCKET)
      .remove(paths);

    if (storageError) {
      console.error('[supabase] Storage remove:', storageError.message);
    }
  }

  const { error } = await getSupabase().from('beats').delete().eq('id', id);

  if (error) {
    throw new Error(`Не удалось удалить бит из БД: ${error.message}`);
  }

  return existing;
}

/**
 * Загрузка файла в Supabase Storage (бакет `beats`).
 *
 * buffer → upload(path) → постоянный публичный URL вида
 * https://….supabase.co/storage/v1/object/public/beats/audio/….mp3
 *
 * path сохраняем в БД, чтобы потом вызвать remove() при DELETE.
 */
export async function uploadMediaFile(
  folder: 'audio' | 'covers',
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ publicUrl: string; path: string }> {
  const objectPath = `${folder}/${filename}`;

  const { error } = await getSupabase().storage
    .from(BEATS_BUCKET)
    .upload(objectPath, buffer, {
      contentType,
      upsert: false,
      cacheControl: '31536000',
    });

  if (error) {
    throw new Error(`Ошибка Storage upload (${objectPath}): ${error.message}`);
  }

  // getPublicUrl собирает URL локально (бакет должен быть Public)
  const { data } = getSupabase().storage
    .from(BEATS_BUCKET)
    .getPublicUrl(objectPath);

  return { publicUrl: data.publicUrl, path: objectPath };
}
