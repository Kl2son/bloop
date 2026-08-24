import { useState, type MouseEvent } from 'react';
import type { Beat } from '../../types';
import { usePlayer } from '../../hooks/usePlayer';
import { usePlayerStore } from '../../store/playerStore';
import { useBeatsStore } from '../../store/beatsStore';
import { useNavStore } from '../../store/navStore';
import { beatsService } from '../../services/beats.service';
import { isUploadedBeat, mediaUrl } from '../../services/media';

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
  const { current, isPlaying, play, toggle } = usePlayer();
  const stop = usePlayerStore((s) => s.stop);
  const removeBeat = useBeatsStore((s) => s.removeBeat);
  const setNotice = useNavStore((s) => s.setNotice);

  const tone =
    COVER_TONES[Number.parseInt(beat.id, 10) % COVER_TONES.length] ??
    COVER_TONES[0];
  const isActive = current?.id === beat.id;
  const [coverFailed, setCoverFailed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const coverSrc = mediaUrl(beat.coverUrl);
  const canDelete = isUploadedBeat(beat);
  const showCover =
    Boolean(coverSrc) &&
    !coverFailed &&
    (coverSrc.includes('/uploads') || coverSrc.startsWith('http'));

  const handlePlay = () => {
    if (isActive) {
      toggle();
      return;
    }
    // В плеер кладём бит с абсолютным audioUrl
    play({ ...beat, audioUrl: mediaUrl(beat.audioUrl), coverUrl: coverSrc });
  };

  const handleBuyOrPlay = () => {
    play({ ...beat, audioUrl: mediaUrl(beat.audioUrl), coverUrl: coverSrc });
  };

  const handleDelete = async (event: MouseEvent) => {
    event.stopPropagation();
    if (deleting) return;

    const ok = window.confirm(`Удалить «${beat.title}»?`);
    if (!ok) return;

    setDeleting(true);
    try {
      const response = await beatsService.delete(beat.id);
      removeBeat(beat.id);
      if (current?.id === beat.id) stop();
      setNotice(response.message ?? 'Бит удалён');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Не удалось удалить');
    } finally {
      setDeleting(false);
    }
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
            src={coverSrc}
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

        {canDelete && (
          <span
            role="presentation"
            className="absolute right-2 top-2 z-10 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-opacity hover:bg-black/65 disabled:opacity-50"
              aria-label={`Удалить ${beat.title}`}
              title="Удалить"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 7h14M10 11v6M14 11v6M9 7V5h6v2M7 7l1 12h8l1-12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </span>
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
