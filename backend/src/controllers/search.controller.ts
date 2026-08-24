import type { RequestHandler } from 'express';
import { listBeats } from '../store/beats.store';
import type { Beat } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * POST /api/search/by-lyrics
 *
 * ─── Как работает req.body в Express ───
 *
 * Когда фронтенд шлёт POST с заголовком Content-Type: application/json
 * и телом вида { "lyrics": "ночь, дождь и грусть..." }, middleware express.json()
 * (подключён в app.ts) читает поток байтов, парсит JSON и кладёт результат
 * в объект req.body.
 *
 *   req  — весь HTTP-запрос (заголовки, URL, метод, тело…)
 *   req.body — уже распарсенное тело; поля доступны как req.body.lyrics
 *
 * Без express.json() req.body был бы undefined — Express сам JSON не разбирает.
 * Для FormData (multipart) используют Multer, для JSON — express.json().
 */

/** Одна «нейронная» группа: ключевые слова → теги настроения */
interface KeywordGroup {
  tags: string[];
  keywords: string[];
}

/**
 * Заглушка «нейросети»: словарь ключевых слов → теги битов.
 * В проде сюда придёт embedding-модель; сейчас имитируем семантику
 * через простой поиск подстрок в тексте лирики.
 */
const KEYWORD_GROUPS: KeywordGroup[] = [
  {
    tags: ['Sad', 'Melodic'],
    keywords: [
      'грусть',
      'груст',
      'любов',
      'дожд',
      'слез',
      'слёз',
      'одиноч',
      'тоск',
      'боль',
      'расста',
      'sad',
      'love',
      'rain',
      'tears',
      'lonely',
      'melancholy',
      'heartbreak',
    ],
  },
  {
    tags: ['Dark', 'Drill'],
    keywords: [
      'ноч',
      'скорост',
      'агресс',
      'тёмн',
      'темн',
      'drill',
      'rage',
      'street',
      'dark',
      'night',
      'speed',
      'aggression',
      'angry',
      'violence',
      'стрель',
      'кров',
    ],
  },
  {
    tags: ['Trap', 'Dark'],
    keywords: ['trap', 'трэп', 'smoke', 'haze', 'hazy', 'дим', 'дым', 'flex'],
  },
  {
    tags: ['Uplifting', 'Melodic'],
    keywords: [
      'свет',
      'радост',
      'мечт',
      'золот',
      'happy',
      'gold',
      'sun',
      'dream',
      'hope',
    ],
  },
  {
    tags: ['Chill', 'Melodic'],
    keywords: ['chill', 'soft', 'мягк', 'спокой', 'relax', 'lounge'],
  },
];

/** Нормализация текста: нижний регистр, ё→е для стабильного поиска */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/ё/g, 'e').trim();
}

/**
 * Имитация ИИ-анализа лирики.
 * Проходит по группам KEYWORD_GROUPS и ищет совпадения ключевых слов
 * в тексте (includes). Найденные теги складываются в Set — без дублей.
 */
function analyzeLyricsWithAiStub(lyrics: string): {
  detectedTags: string[];
  matchedKeywords: string[];
} {
  const normalized = normalizeText(lyrics);
  const detectedTags = new Set<string>();
  const matchedKeywords: string[] = [];

  for (const group of KEYWORD_GROUPS) {
    for (const keyword of group.keywords) {
      if (normalized.includes(keyword)) {
        matchedKeywords.push(keyword);
        for (const tag of group.tags) {
          detectedTags.add(tag);
        }
      }
    }
  }

  return {
    detectedTags: [...detectedTags],
    matchedKeywords,
  };
}

/** Теги бита: явные tags[] или fallback из mood (строка через запятую) */
function getBeatTags(beat: Beat): string[] {
  if (beat.tags?.length) {
    return beat.tags.map((t) => t.toLowerCase());
  }
  if (beat.mood) {
    return beat.mood.split(',').map((part) => part.trim().toLowerCase());
  }
  return [];
}

/**
 * Фильтрация каталога по тегам, «найденным нейросетью».
 *
 * ─── Как бэкенд фильтрует массивы ───
 *
 * 1. listBeats() читает таблицу beats из Supabase (PostgreSQL).
 * 2. .filter / .map / .sort — обычная работа с массивом в Node.
 */
function findBeatsByDetectedTags(
  catalog: Beat[],
  detectedTags: string[],
): Beat[] {
  if (detectedTags.length === 0) {
    return catalog;
  }

  const detectedSet = new Set(detectedTags.map((t) => t.toLowerCase()));

  return catalog
    .map((beat) => {
      const beatTags = getBeatTags(beat);
      const matchScore = beatTags.filter((tag) =>
        detectedSet.has(tag),
      ).length;
      return { beat, matchScore };
    })
    .filter(({ matchScore }) => matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .map(({ beat }) => beat);
}

export const searchByLyrics: RequestHandler = async (req, res): Promise<void> => {
  const rawLyrics = req.body?.lyrics;
  const lyrics = typeof rawLyrics === 'string' ? rawLyrics.trim() : '';

  if (!lyrics) {
    res.status(400).json({
      success: false,
      message: 'Передайте текст лирики в поле lyrics',
    });
    return;
  }

  if (lyrics.length < 3) {
    res.status(400).json({
      success: false,
      message: 'Текст слишком короткий для анализа',
    });
    return;
  }

  try {
    if (!isSupabaseConfigured()) {
      res.status(503).json({
        success: false,
        message: 'Supabase не настроен (SUPABASE_URL / SUPABASE_KEY)',
      });
      return;
    }

    const { detectedTags, matchedKeywords } = analyzeLyricsWithAiStub(lyrics);
    const catalog = await listBeats();
    const results = findBeatsByDetectedTags(catalog, detectedTags);

    res.json({
      success: true,
      data: results,
      message:
        detectedTags.length > 0
          ? `Подобрано ${results.length} бит(ов) по настроению текста`
          : 'Ключевые слова не найдены — показан полный каталог',
      meta: {
        detectedTags,
        matchedKeywords,
        lyricsLength: lyrics.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка поиска';
    res.status(500).json({ success: false, message });
  }
};
