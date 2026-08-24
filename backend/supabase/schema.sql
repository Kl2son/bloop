-- =============================================================================
-- Bloop: создание таблицы beats + политики для Storage
-- Куда вставить: Supabase Dashboard → SQL Editor → New query → вставить → Run
-- =============================================================================

-- 1) Таблица метаданных треков
create table if not exists public.beats (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  price numeric(10, 2) not null check (price >= 0),
  bpm integer,
  audio_url text not null,
  cover_url text not null,
  -- пути внутри бакета Storage (нужны для удаления файлов)
  audio_path text,
  cover_path text,
  -- опционально для ИИ-поиска
  mood text,
  key text,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

create index if not exists beats_created_at_idx
  on public.beats (created_at desc);

-- 2) RLS для таблицы
alter table public.beats enable row level security;

-- Чтение каталога
drop policy if exists "Public read beats" on public.beats;
create policy "Public read beats"
  on public.beats for select
  to anon, authenticated, public
  using (true);

-- Запись с бэкенда (publishable / anon key)
drop policy if exists "Public insert beats" on public.beats;
create policy "Public insert beats"
  on public.beats for insert
  to anon, authenticated, public
  with check (true);

-- Удаление с бэкенда
drop policy if exists "Public delete beats" on public.beats;
create policy "Public delete beats"
  on public.beats for delete
  to anon, authenticated, public
  using (true);

-- 3) Политики Storage для бакета "beats"
-- (бакет уже создан как Public в UI)

drop policy if exists "Public read beats objects" on storage.objects;
create policy "Public read beats objects"
  on storage.objects for select
  to public
  using (bucket_id = 'beats');

drop policy if exists "Public upload beats objects" on storage.objects;
create policy "Public upload beats objects"
  on storage.objects for insert
  to public
  with check (bucket_id = 'beats');

drop policy if exists "Public update beats objects" on storage.objects;
create policy "Public update beats objects"
  on storage.objects for update
  to public
  using (bucket_id = 'beats');

drop policy if exists "Public delete beats objects" on storage.objects;
create policy "Public delete beats objects"
  on storage.objects for delete
  to public
  using (bucket_id = 'beats');

-- 4) Демо-каталог (только если таблица пустая)
insert into public.beats (title, artist, price, bpm, mood, key, tags, audio_url, cover_url)
select * from (values
  ('Midnight Drive', 'NovaBeats', 29::numeric, 140, 'dark, atmospheric', 'Am',
    array['Dark','Atmospheric']::text[],
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://picsum.photos/seed/bloop1/600/600'),
  ('Soft Flex', 'Kairo', 35::numeric, 92, 'chill, melodic', 'F',
    array['Melodic','Chill']::text[],
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://picsum.photos/seed/bloop2/600/600'),
  ('Concrete Echo', 'GrayRoom', 42::numeric, 150, 'hard, industrial', 'Em',
    array['Dark','Drill','Hard']::text[],
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'https://picsum.photos/seed/bloop3/600/600'),
  ('Late Night Text', 'Lumen', 25::numeric, 78, 'emotional, intimate', 'C',
    array['Sad','Melodic']::text[],
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    'https://picsum.photos/seed/bloop4/600/600'),
  ('Gold Dust', 'MiraSound', 49::numeric, 110, 'uplifting, warm', 'G',
    array['Uplifting','Melodic']::text[],
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    'https://picsum.photos/seed/bloop5/600/600'),
  ('Smoke Signal', 'DriftLab', 31::numeric, 135, 'trap, hazy', 'Dm',
    array['Dark','Trap','Drill']::text[],
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    'https://picsum.photos/seed/bloop6/600/600')
) as seed(title, artist, price, bpm, mood, key, tags, audio_url, cover_url)
where not exists (select 1 from public.beats limit 1);
