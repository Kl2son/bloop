import { Beat } from '../types';

/**
 * In-memory хранилище битов.
 * После перезапуска сервера пользовательские загрузки из памяти пропадут,
 * но файлы останутся в /uploads — позже можно привязать БД.
 */
const beats: Beat[] = [
  {
    id: '1',
    title: 'Midnight Drive',
    author: 'NovaBeats',
    coverUrl: '/covers/1.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    price: 29,
    mood: 'dark, atmospheric',
    bpm: 140,
    key: 'Am',
  },
  {
    id: '2',
    title: 'Soft Flex',
    author: 'Kairo',
    coverUrl: '/covers/2.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    price: 35,
    mood: 'chill, melodic',
    bpm: 92,
    key: 'F',
  },
  {
    id: '3',
    title: 'Concrete Echo',
    author: 'GrayRoom',
    coverUrl: '/covers/3.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    price: 42,
    mood: 'hard, industrial',
    bpm: 150,
    key: 'Em',
  },
  {
    id: '4',
    title: 'Late Night Text',
    author: 'Lumen',
    coverUrl: '/covers/4.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    price: 25,
    mood: 'emotional, intimate',
    bpm: 78,
    key: 'C',
  },
  {
    id: '5',
    title: 'Gold Dust',
    author: 'MiraSound',
    coverUrl: '/covers/5.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    price: 49,
    mood: 'uplifting, warm',
    bpm: 110,
    key: 'G',
  },
  {
    id: '6',
    title: 'Smoke Signal',
    author: 'DriftLab',
    coverUrl: '/covers/6.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    price: 31,
    mood: 'trap, hazy',
    bpm: 135,
    key: 'Dm',
  },
];

let nextId = 7;

export function listBeats(): Beat[] {
  return beats;
}

export function findBeatById(id: string): Beat | undefined {
  return beats.find((b) => b.id === id);
}

export function addBeat(beat: Omit<Beat, 'id'>): Beat {
  const created: Beat = { ...beat, id: String(nextId++) };
  // Новые биты — в начало ленты
  beats.unshift(created);
  return created;
}
