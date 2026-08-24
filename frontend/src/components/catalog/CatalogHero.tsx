/**
 * Приветственный Hero над лентой битов.
 * Слоган бренда — главный визуальный якорь каталога, без лишних блоков.
 */
export function CatalogHero() {
  return (
    /*
      mb-10 — отступ снизу до карточек, чтобы Hero не слипался с сеткой.
      max-w-xl — ограничиваем ширину текста: длинная строка плохо читается.
    */
    <header className="mb-10 max-w-xl">
      {/*
        text-3xl / md:text-4xl / lg:text-[2.75rem] — крупный, но не кричащий заголовок.
        font-normal — тонкое начертание (не bold), минимализм.
        tracking-tight — чуть сжатые буквы, «дорогой» вид.
        leading-tight — плотная высота строки для слогана в 1–2 линии.
        text-[var(--ink)] — основной цвет текста из темы.
      */}
      <h1
        className="text-3xl font-normal leading-tight tracking-tight text-[var(--ink)] md:text-4xl lg:text-[2.75rem]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Bloop — биты легко
      </h1>

      {/*
        mt-3 — небольшой зазор между слоганом и подписью.
        text-sm — компактный вторичный текст, не конкурирует со слоганом.
        leading-relaxed — чуть свободнее межстрочный интервал для читаемости.
        text-[var(--muted)] — приглушённый цвет, иерархия «главное → пояснение».
      */}
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
        Первый маркетплейс битов с искусственным интеллектом под твой текст
      </p>
    </header>
  );
}
