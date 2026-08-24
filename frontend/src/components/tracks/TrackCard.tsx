import { useState } from 'react';
import type { Beat } from '../../types';
import { usePlayer } from '../../hooks/usePlayer';

const COVER_TONES = [
  'from-[#2c3e3a] to-[#8fad9f]',
  'from-[#3a322c] to-[#c4a882]',
  'from-[#2a3340] to-[#7a8fa8]',
  'from-[#3d2f35] to-[#b88996]',
  'from-[#2f3d2c] to-[#9aaf7e]',
  'from-[#35302a] to-[#a8946e]',
];

interface TrackCardProps {
  beat: Beat;
}

export function TrackCard({ beat }: TrackCardProps) {
  /**
   * Берём экшены из Zustand через хук usePlayer.
   * play(beat) кладёт этот бит в глобальный current и ставит isPlaying=true —
   * PlayerBar / AudioEngine подписаны на стор и сразу подхватят трек.
   */
  const { current, isPlaying, play, toggle } = usePlayer();
  const tone =
    COVER_TONES[Number.parseInt(beat.id, 10) % COVER_TONES.length] ??
    COVER_TONES[0];
  const isActive = current?.id === beat.id;
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover =
    Boolean(beat.coverUrl) &&
    !coverFailed &&
    (beat.coverUrl.startsWith('/uploads') ||
      beat.coverUrl.startsWith('http'));

  const handlePlay = () => {
    if (isActive) {
      toggle();
      return;
    }
    play(beat);
  };

  const handleBuyOrPlay = () => {
    play(beat);
  };

  return (
    <article className="group flex flex-col gap-3">
      <button
        type="button"
        onClick={handlePlay}
        className={`relative aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br ${tone} transition-transform duration-300 ease-out group-hover:scale-[1.015]`}
        aria-label={isActive && isPlaying ? `Пауза ${beat.title}` : `Слушать ${beat.title}`}
      >
        {showCover ? (
          <img
            src={beat.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <span
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 45%)',
            }}
          />
        )}
        <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white/90">
          <span className="text-xs tabular-nums opacity-80 drop-shadow">
            {beat.bpm ? `${beat.bpm} BPM` : ''}
            {beat.key ? ` · ${beat.key}` : ''}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 md:opacity-0">
            {isActive && isPlaying ? (
              <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden>
                <rect x="2" y="1" width="3" height="10" rx="0.5" fill="currentColor" />
                <rect x="7" y="1" width="3" height="10" rx="0.5" fill="currentColor" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden>
                <path d="M3 1.5v9l8-4.5-8-4.5z" fill="currentColor" />
              </svg>
            )}
          </span>
        </span>
      </button>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className="truncate text-[15px] font-semibold tracking-tight text-[var(--ink)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {beat.title}
          </h2>
          <p className="truncate text-sm text-[var(--muted)]">{beat.author}</p>
        </div>

        <button
          type="button"
          onClick={handleBuyOrPlay}
          className="shrink-0 rounded-md bg-[var(--ink)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-85"
          aria-label={`Слушать и купить ${beat.title} за $${beat.price}`}
        >
          ${beat.price}
        </button>
      </div>
    </article>
  );
}
