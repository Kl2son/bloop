# loop — marketplace битов

Минималистичный маркетплейс битов. Архитектура разделена на `frontend` и `backend` для будущего React Native клиента.

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | React (Vite) · TypeScript · Tailwind CSS · Zustand |
| Backend | Node.js · Express · TypeScript |

## Структура

```
/frontend
  src/
    components/   # UI: layout, tracks, player
    hooks/        # useBeats, usePlayer
    services/     # изолированные API-клиенты
    store/        # Zustand (плеер)
/backend
  src/
    controllers/  # бизнес-обработчики (в т.ч. AI-заглушки)
    routes/       # Express-роуты
    types/
```

## AI-эндпоинты (заглушки)

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/search/by-lyrics` | Поиск битов по семантике лирики |
| POST | `/api/ai/co-create` | ИИ-соавторство (MIDI/аудио) |
| POST | `/api/ai/generate-demo` | Демо-наброски для рэперов |
| POST | `/api/ai/mastering` | Авто-сведение и мастеринг |

Также доступны: `GET /api/beats`, `GET /api/beats/:id`, `GET /api/health`.

## Запуск

```bash
# Backend — http://localhost:3001
cd backend
npm install
npm run dev

# Frontend — http://localhost:5173 (проксирует /api → backend)
cd frontend
npm install
npm run dev
```
