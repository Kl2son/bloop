import { Request, Response } from 'express';
import { listBeats } from '../store/beats.store';
import { Beat } from '../types';

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
 * 1. listBeats() возвращает массив Beat[] из памяти.
 * 2. .filter(beat => …) оставляет только элементы, где условие true.
 *    Для каждого бита проверяем пересечение его тегов с detectedTags.
 * 3. .map(beat => ({ … })) добавляет поле matchScore — сколько тегов совпало.
 * 4. .sort((a, b) => b.matchScore - a.matchScore) — сильнее совпадение выше.
 *
 * Пересечение тегов: beatTags.some(tag => detectedSet.has(tag))
 * — «есть ли хотя бы один общий тег».
 */
function findBeatsByDetectedTags(detectedTags: string[]): Beat[] {
  const catalog = listBeats();

  if (detectedTags.length === 0) {
    // Ничего не распознали — отдаём весь каталог (fallback)
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

export const searchByLyrics = (req: Request, res: Response): void => {
  /*
   * req.body — объект после express.json().
   * Фронт шлёт: { "lyrics": "текст рифм..." }
   * Поле может отсутствовать или быть не строкой — проверяем ниже.
   */
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

  // «Нейросеть» сканирует текст и возвращает теги настроения
  const { detectedTags, matchedKeywords } = analyzeLyricsWithAiStub(lyrics);

  // Фильтруем mock-каталог по этим тегам
  const results = findBeatsByDetectedTags(detectedTags);

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
};
