import { useState, type FormEvent } from 'react';
import { beatsService } from '../../services/beats.service';
import { useBeatsStore } from '../../store/beatsStore';
import { useNavStore } from '../../store/navStore';

/**
 * Страница «Добавить бит».
 *
 * FormData — специальный объект браузера для отправки форм с файлами.
 * В отличие от JSON, он умеет нести бинарные данные (MP3, картинки)
 * вместе с текстовыми полями в одном HTTP-запросе multipart/form-data.
 *
 * Автор не спрашивается в форме: до авторизации бэкенд подставит
 * временное имя; позже возьмём его из профиля пользователя.
 */
export function UploadBeatPage() {
  const prependBeat = useBeatsStore((s) => s.prependBeat);
  const setPage = useNavStore((s) => s.setPage);
  const setNotice = useNavStore((s) => s.setNotice);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [bpm, setBpm] = useState('');
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!audio || !cover) {
      setError('Выберите MP3 и обложку');
      return;
    }

    const priceNum = Number(price);
    const bpmNum = bpm.trim() === '' ? undefined : Number(bpm);

    if (!title.trim()) {
      setError('Укажите название');
      return;
    }

    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError('Укажите корректную цену');
      return;
    }

    if (bpmNum !== undefined && (!Number.isFinite(bpmNum) || bpmNum <= 0)) {
      setError('BPM должен быть положительным числом');
      return;
    }

    setSubmitting(true);

    try {
      const response = await beatsService.upload({
        title: title.trim(),
        price: priceNum,
        bpm: bpmNum,
        audio,
        cover,
      });

      if (response.data) {
        prependBeat(response.data);
      }

      setNotice(response.message ?? 'Бит успешно загружен');
      setPage('uploads');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/70 focus:border-[var(--accent)]';

  return (
    <section className="mx-auto max-w-lg px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <button
          type="button"
          onClick={() => setPage('uploads')}
          className="mb-3 text-xs text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
        >
          ← Мои биты
        </button>
        <h1
          className="text-3xl font-normal tracking-tight text-[var(--ink)] md:text-4xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Добавить бит
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Название, цена, файлы — и бит сразу в каталоге.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--muted)]">Название</span>
          <input
            className={fieldClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Midnight Drive"
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--muted)]">Цена, $</span>
            <input
              className={fieldClass}
              type="number"
              min={0}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="29"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--muted)]">BPM</span>
            <input
              className={fieldClass}
              type="number"
              min={1}
              step={1}
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              placeholder="140"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--muted)]">Файл бита (MP3)</span>
          <input
            type="file"
            accept="audio/mpeg,.mp3"
            className="text-sm text-[var(--muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--ink)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
            onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
            required
          />
          {audio && (
            <span className="text-xs text-[var(--muted)]">{audio.name}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--muted)]">
            Обложка (JPG / PNG)
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            className="text-sm text-[var(--muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--ink)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
            required
          />
          {cover && (
            <span className="text-xs text-[var(--muted)]">{cover.name}</span>
          )}
        </label>

        {error && (
          <p className="text-sm text-red-700/80" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-md bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {submitting ? 'Загрузка…' : 'Опубликовать'}
        </button>
      </form>
    </section>
  );
}
