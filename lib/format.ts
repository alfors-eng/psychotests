export function plural(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'вопрос';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'вопроса';
  return 'вопросов';
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatDay = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
export const formatDayShort = (ms: number) => new Date(ms).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' });
/** Число для таблиц: десятичная запятая, знак минус, «+» у положительных изменений. */
export const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n * 100) / 100).toString().replace('.', ',')}`;
