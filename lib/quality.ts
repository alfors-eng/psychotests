/** Время прохождения как признак качества ответов. Порог около 2 секунд на пункт — ориентир из литературы по небрежным ответам (Huang и др., 2012). */
export const MIN_SECONDS_PER_ITEM = 2;

export function formatDuration(sec: number): string {
  const s = Math.round(sec);
  if (s < 60) return `${s} с`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m} мин ${r} с` : `${m} мин`;
}

export interface TimeQuality {
  perItem: number;
  tooFast: boolean;
  text: string;
}

export function timeQuality(durationSec: number | undefined, items: number): TimeQuality | null {
  if (durationSec === undefined || !items) return null;
  const perItem = durationSec / items;
  const tooFast = items >= 5 && perItem < MIN_SECONDS_PER_ITEM;
  const base = `Время прохождения: ${formatDuration(durationSec)}, около ${perItem < 10 ? perItem.toFixed(1).replace('.', ',') : Math.round(perItem)} с на пункт.`;
  return {
    perItem,
    tooFast,
    text: tooFast
      ? `${base} Это быстрее, чем обычно успевают вчитаться (меньше ${MIN_SECONDS_PER_ITEM} с на пункт), поэтому ответы могли быть неточными. Если вы отвечали не думая, пройдите тест заново.`
      : base,
  };
}
