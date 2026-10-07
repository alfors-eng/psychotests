import { scoreTest } from './engine';
import type { CategoryId, HistoryEntry, TestDef } from './types';

/** Одна «персональная характеристика» = одна шкала из последнего прохождения теста. */
export interface Characteristic {
  key: string; // testId:scaleId
  testId: string;
  testTitle: string;
  short: string;
  category: CategoryId;
  isClinical: boolean;
  scaleId: string;
  title: string;
  percent: number; // положение на шкале теста, 0..100
  value: number;
  max: number;
  rangeTitle?: string;
  date: string; // ISO
}

/** Краткое имя теста: «IPIP» из «Большая пятёрка (IPIP, 50 вопросов)» или первое слово названия. */
export function shortName(title: string): string {
  const m = title.match(/\(([^)]+)\)\s*$/);
  if (m) return m[1].split(',')[0].trim();
  return title.split(/\s+/)[0];
}

/** Берёт самое свежее полное прохождение каждого теста и раскладывает его на шкалы. */
export function buildCharacteristics(tests: TestDef[], history: HistoryEntry[]): Characteristic[] {
  const byId = new Map(tests.map((t) => [t.id, t]));
  const latest = new Map<string, HistoryEntry>();
  for (const h of history) {
    const prev = latest.get(h.testId);
    if (byId.has(h.testId) && (!prev || h.completedAt > prev.completedAt)) latest.set(h.testId, h);
  }
  const out: Characteristic[] = [];
  for (const [testId, entry] of latest) {
    const t = byId.get(testId)!;
    const res = scoreTest(t, entry.answers);
    if (!res.complete) continue;
    for (const s of res.scales) {
      out.push({
        key: `${testId}:${s.id}`,
        testId,
        testTitle: t.title,
        short: shortName(t.title),
        category: t.category,
        isClinical: t.isClinical,
        scaleId: s.id,
        title: s.id === 'total' ? t.scoring.totalTitle ?? t.title : s.title,
        percent: s.percent,
        value: s.value,
        max: s.max,
        rangeTitle: s.range?.title,
        date: entry.completedAt,
      });
    }
  }
  return out;
}

/** Подписи для диаграммы: при совпадении названий добавляем краткое имя теста. */
export function chartLabels(items: Characteristic[]): string[] {
  const count = new Map<string, number>();
  for (const i of items) count.set(i.title, (count.get(i.title) ?? 0) + 1);
  return items.map((i) => ((count.get(i.title) ?? 0) > 1 ? `${i.title} · ${i.short}` : i.title));
}
