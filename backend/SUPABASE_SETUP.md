# Настройка Supabase для Bloop

## Переменные окружения

| Имя | Значение |
|-----|----------|
| `SUPABASE_URL` | `https://mvegibyeplvdnalbrzfs.supabase.co` |
| `SUPABASE_KEY` | publishable или **service_role** (лучше secret на бэкенде) |

Локально: файлы `backend/.env` и `backend/.env.production` (в git не попадают).  
**Render → Environment** — добавьте те же две переменные вручную (иначе после деплоя API не увидит ключи).

> Publishable-ключ можно компрометировать — для продакшена позже замените на **service_role** из Settings → API.

## Создать таблицу (обязательно один раз)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard) → проект Bloop  
2. Слева: **SQL Editor**  
3. **New query**  
4. Вставьте весь файл `backend/supabase/schema.sql`  
5. Нажмите **Run** (или Ctrl+Enter)

Скрипт создаст:
- таблицу `beats` (`id`, `title`, `artist`, `price`, `bpm`, `audio_url`, `cover_url`, `audio_path`, `cover_path`, `created_at`, …)
- RLS-политики на чтение/запись/удаление
- политики Storage для бакета `beats`
- демо-треки (если таблица была пустой)

## Бакет Storage

Уже создан: **Storage → beats** (Public).  
Папки `audio/` и `covers/` появятся при первой загрузке.

## Проверка

```bash
cd backend
npm run dev
curl http://localhost:3001/api/health
# supabase: true
```
