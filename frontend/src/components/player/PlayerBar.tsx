import { usePlayer } from '../../hooks/usePlayer';
import { AudioEngine } from './AudioEngine';

/** Форматирует секунды в вид m:ss для шкалы времени */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Фиксированная панель плеера внизу экрана.
 *
 * Данные (current, isPlaying, currentTime…) приходят из Zustand через usePlayer.
 * Звук не играет здесь напрямую — за это отвечает скрытый <AudioEngine />,
 * который слушает тот же стор и управляет HTML5 <audio>.
 */
export function PlayerBar() {
  const {
    current,
    isPlaying,
    currentTime,
    duration,
    volume,
    toggle,
    seek,
    setVolume,
  } = usePlayer();

  const progressMax = duration > 0 ? duration : 0;
  const canControl = Boolean(current);

  return (
    <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[var(--player)] text-white">
      {/* Скрытый движок: один <audio> на всё приложение */}
      <AudioEngine />

      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 md:px-6">
        {/* Верхний ряд: play, инфо о треке, громкость */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            type="button"
            onClick={toggle}
            disabled={!canControl}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--ink)] transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-30"
            aria-label={isPlaying ? 'Пауза' : 'Играть'}
          >
            {/* Лаконичные SVG вместо эмодзи */}
            {isPlaying ? (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <rect x="2" y="1" width="3" height="10" rx="0.5" fill="currentColor" />
                <rect x="7" y="1" width="3" height="10" rx="0.5" fill="currentColor" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <path d="M3 1.5v9l8-4.5-8-4.5z" fill="currentColor" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            {current ? (
              <>
                <p
                  className="truncate text-sm font-semibold tracking-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {current.title}
                </p>
                <p className="truncate text-xs text-white/55">{current.author}</p>
              </>
            ) : (
              <p className="text-sm text-white/45">Выберите бит</p>
            )}
          </div>

          {/* Громкость: узкий range, без лишней графики */}
          <div className="flex w-24 shrink-0 items-center gap-2 sm:w-32">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0 text-white/50"
              aria-hidden
            >
              <path
                d="M4 9v6h4l5 4V5L8 9H4z"
                fill="currentColor"
              />
              <path
                d="M16.5 8.5a5 5 0 010 7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              disabled={!canControl}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[var(--accent)] disabled:cursor-default disabled:opacity-40"
              aria-label="Громкость"
            />
          </div>
        </div>

        {/* Нижний ряд: время + ползунок прогресса трека */}
        <div className="flex items-center gap-2">
          <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-white/45">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={progressMax || 1}
            step={0.1}
            value={Math.min(currentTime, progressMax || 0)}
            disabled={!canControl || progressMax <= 0}
            onChange={(e) => seek(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-[var(--accent)] disabled:cursor-default disabled:opacity-40"
            aria-label="Прогресс трека"
          />
          <span className="w-8 shrink-0 text-[11px] tabular-nums text-white/45">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </footer>
  );
}
