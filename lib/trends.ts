import { evaluateSafety, keyedValue, questionBounds, questionOptions, scoreTest } from './engine';
import type { Answers, HistoryEntry, ScaleResult, TestDef } from './types';

/** Что считать «лучше» на шкале: 'down' — чем ниже, тем лучше (симптомы, нагрузка), 'up' — чем выше, тем лучше (ресурсы). */
export type Polarity = 'down' | 'up' | 'neutral';

const DOWN = new Set([
  'phq-9', 'gad-7', 'phq-4', 'phq-15', 'dass-21', 'k6', 'pcl-5', 'pc-ptsd-5', 'oci-r', 'cesd', 'gds-15',
  'pss-10', 'bat-12', 'ucla-3', 'aaq-ii', 'cfq-7', 'audit',
]);
const UP = new Set(['who-5', 'swls', 'flourishing', 'rosenberg-self-esteem', 'brs', 'gse', 'lot-r', 'scs-sf', 'grit-s']);

export function polarity(testId: string, scaleId: string): Polarity {
  if (testId === 'spane') return scaleId === 'N' ? 'down' : 'up';
  if (DOWN.has(testId)) return 'down';
  if (UP.has(testId)) return 'up';
  return 'neutral'; // черты, интересы, стили: «лучше/хуже» не определено
}

/** Порог значимого изменения: из литературы там, где он опубликован, иначе условный (10 % диапазона шкалы). */
export interface Threshold {
  points: number;
  /** Порог «клинически значимого» (для PCL-5: 10 баллов). */
  strong?: number;
  basis: string;
}

const MCID: Record<string, Threshold> = {
  'phq-9:total': {
    points: 5,
    basis: 'Löwe и др., 2004: индивидуальное изменение на 5 и более баллов (две стандартные ошибки измерения) считается клинически значимым.',
  },
  'gad-7:total': {
    points: 4,
    basis: 'Toussaint и др., 2020: ориентир около 4 баллов (оценка по одной выборке; для тревоги данные ограничены).',
  },
  'pcl-5:total': {
    points: 5,
    strong: 10,
    basis: 'Национальный центр по изучению ПТСР (США): 5 баллов — надёжное изменение, 10 и более — клинически значимое; цифры унаследованы от версии для DSM-IV и для PCL-5 окончательно не подтверждены.',
  },
  'who-5:total': {
    points: 2.5,
    basis: 'WHO-5: изменение на 10 процентных пунктов (2,5 балла из 25) считается значимым (Topp и др., 2015).',
  },
};

export const GENERIC_BASIS =
  'Для этой шкалы опубликованного порога нет, поэтому использован условный: изменение не менее 10 % диапазона шкалы. Это ориентир по правилу «около половины стандартного отклонения» (Norman и др., 2003), а не клинический критерий.';

export function thresholdFor(testId: string, scale: { id: string; min: number; max: number }): Threshold {
  const t = MCID[`${testId}:${scale.id}`];
  if (t) return t;
  return { points: (scale.max - scale.min) * 0.1, basis: GENERIC_BASIS };
}

export type ChangeKind = 'better' | 'worse' | 'stable' | 'changed';

export interface Change {
  delta: number;
  kind: ChangeKind;
  threshold: Threshold;
  /** Достигнут ли порог «клинически значимого» изменения (если он задан). */
  strong: boolean;
}

export function classifyChange(testId: string, scale: { id: string; min: number; max: number }, before: number, after: number): Change {
  const threshold = thresholdFor(testId, scale);
  const delta = after - before;
  const reliable = Math.abs(delta) + 1e-9 >= threshold.points;
  const pol = polarity(testId, scale.id);
  let kind: ChangeKind = 'stable';
  if (reliable) {
    if (pol === 'neutral') kind = 'changed';
    else kind = (pol === 'down' ? delta < 0 : delta > 0) ? 'better' : 'worse';
  }
  const strong = !!threshold.strong && Math.abs(delta) + 1e-9 >= threshold.strong;
  return { delta, kind, threshold, strong };
}

export const CHANGE_LABEL: Record<ChangeKind, string> = {
  better: 'Улучшение',
  worse: 'Ухудшение',
  stable: 'Без значимых изменений',
  changed: 'Изменение',
};

export interface SeriesPoint {
  entry: HistoryEntry;
  scales: ScaleResult[];
}

export interface TestSeries {
  test: TestDef;
  points: SeriesPoint[]; // по возрастанию даты
}

/** Все полные прохождения каждого теста, по возрастанию даты. */
export function buildSeries(tests: TestDef[], history: HistoryEntry[]): TestSeries[] {
  const byId = new Map(tests.map((t) => [t.id, t]));
  const groups = new Map<string, HistoryEntry[]>();
  for (const h of history) {
    if (!byId.has(h.testId)) continue;
    groups.set(h.testId, [...(groups.get(h.testId) ?? []), h]);
  }
  const out: TestSeries[] = [];
  for (const [id, entries] of groups) {
    const test = byId.get(id)!;
    const points = [...entries]
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
      .map((entry) => ({ entry, res: scoreTest(test, entry.answers) }))
      .filter((x) => x.res.complete)
      .map((x) => ({ entry: x.entry, scales: x.res.scales }));
    if (points.length) out.push({ test, points });
  }
  return out.sort((a, b) => b.points.length - a.points.length || a.test.title.localeCompare(b.test.title, 'ru'));
}

export interface ItemChange {
  id: string;
  index: number;
  text: string;
  beforeLabel: string;
  afterLabel: string;
  /** Положение ответа на шкале пункта с учётом ключа, 0–100 %. */
  before: number;
  after: number;
  delta: number;
  scaleId: string;
}

/** Сравнение двух прохождений теста по пунктам. */
export function compareItems(test: TestDef, a: Answers, b: Answers): ItemChange[] {
  const out: ItemChange[] = [];
  test.questions.forEach((q, i) => {
    if (q.filler || a[q.id] === undefined || b[q.id] === undefined) return;
    const pct = (raw: number) => {
      const keyed = keyedValue(test, q.id, raw);
      if (q.scoreWhen) return keyed * 100;
      const { min, max } = questionBounds(test, q);
      return max === min ? 0 : ((keyed - min) / (max - min)) * 100;
    };
    const label = (raw: number) => questionOptions(test, q).find((o) => o.value === raw)?.label ?? String(raw);
    const before = pct(a[q.id]);
    const after = pct(b[q.id]);
    out.push({
      id: q.id,
      index: i + 1,
      text: q.text,
      beforeLabel: label(a[q.id]),
      afterLabel: label(b[q.id]),
      before,
      after,
      delta: after - before,
      scaleId: test.scoring.method === 'sum' || test.scoring.method === 'average' ? 'total' : (q.subscale ?? ''),
    });
  });
  return out;
}

/** Период, о котором спрашивает тест (в днях): раньше этого срока повторять тест нет смысла. */
export const RECALL_DAYS: Record<string, number> = {
  'phq-9': 14,
  'gad-7': 14,
  'phq-4': 14,
  'who-5': 14,
  'dass-21': 7,
  cesd: 7,
  'gds-15': 7,
  k6: 30,
  'pcl-5': 30,
  'oci-r': 30,
  'pc-ptsd-5': 30,
  'pss-10': 30,
  'phq-15': 28,
  spane: 28,
  audit: 365,
  'asrs-v1-1': 180,
};

export interface RetestRow {
  test: TestDef;
  last: string;
  recallDays: number;
  availableAt: Date;
  daysLeft: number; // ≤ 0 — можно проходить снова
}

export function buildRetestPlan(series: TestSeries[], now = new Date()): RetestRow[] {
  const rows: RetestRow[] = [];
  for (const s of series) {
    const days = RECALL_DAYS[s.test.id];
    if (!days) continue;
    const last = s.points[s.points.length - 1].entry.completedAt;
    const availableAt = new Date(new Date(last).getTime() + days * 86_400_000);
    rows.push({ test: s.test, last, recallDays: days, availableAt, daysLeft: Math.ceil((availableAt.getTime() - now.getTime()) / 86_400_000) });
  }
  return rows.sort((a, b) => a.daysLeft - b.daysLeft);
}

export interface ScreeningRow {
  test: TestDef;
  entry: HistoryEntry;
  scales: ScaleResult[];
  flagged: boolean;
  crisis: boolean;
}

/** Последнее прохождение каждого скрининга и признак «достигнут порог». */
export function buildScreenings(series: TestSeries[]): ScreeningRow[] {
  const rows: ScreeningRow[] = [];
  for (const s of series) {
    if (!s.test.isClinical) continue;
    const last = s.points[s.points.length - 1];
    const res = scoreTest(s.test, last.entry.answers);
    const safety = evaluateSafety(s.test, last.entry.answers, res);
    rows.push({ test: s.test, entry: last.entry, scales: last.scales, flagged: safety.showHelp, crisis: safety.crisis });
  }
  return rows.sort((a, b) => Number(b.crisis) - Number(a.crisis) || Number(b.flagged) - Number(a.flagged) || a.test.title.localeCompare(b.test.title, 'ru'));
}

export interface Recommendation {
  id: string;
  title: string;
  text: string;
  /** id тестов, которые стоит пройти. */
  tests: string[];
  basis: string;
}

/**
 * Ступенчатая оценка: короткий скрининг → подробный тест → специалист. Правила основаны на рекомендациях авторов
 * инструментов; каждое правило показывает источник. Это не назначение лечения.
 */
export function buildRecommendations(available: TestDef[], rows: ScreeningRow[], series: TestSeries[]): Recommendation[] {
  const ready = new Set(available.map((t) => t.id));
  const latest = new Map(series.map((s) => [s.test.id, s.points[s.points.length - 1]]));
  const has = (id: string) => latest.has(id);
  const scale = (id: string, sc = 'total'): number | null => latest.get(id)?.scales.find((x) => x.id === sc)?.value ?? null;
  const flagged = (id: string) => rows.find((r) => r.test.id === id)?.flagged ?? false;
  const out: Recommendation[] = [];
  const add = (r: Recommendation) => {
    const tests = r.tests.filter((t) => ready.has(t) && !has(t));
    if (tests.length) out.push({ ...r, tests });
  };

  const anx = scale('phq-4', 'anx');
  const dep = scale('phq-4', 'dep');
  if (anx !== null && anx >= 3)
    add({ id: 'phq4-anx', title: 'Подробнее о тревоге', text: 'В коротком скрининге PHQ-4 тревожная часть набрала 3 балла или больше. Следующий шаг — GAD-7.', tests: ['gad-7'], basis: 'Kroenke и др., 2009: балл 3 и более по двухпунктной подшкале — повод для подробной оценки.' });
  if (dep !== null && dep >= 3)
    add({ id: 'phq4-dep', title: 'Подробнее о настроении', text: 'В PHQ-4 депрессивная часть набрала 3 балла или больше. Следующий шаг — PHQ-9.', tests: ['phq-9'], basis: 'Kroenke и др., 2009: балл 3 и более по двухпунктной подшкале — повод для подробной оценки.' });
  if (flagged('k6'))
    add({ id: 'k6', title: 'Уточнить причину дистресса', text: 'K6 показывает повышенный дистресс. Чтобы понять, что за ним стоит, пройдите PHQ-9 и GAD-7.', tests: ['phq-9', 'gad-7'], basis: 'Kessler и др., 2003: K6 служит первым шагом скрининга психологического дистресса.' });
  const who = scale('who-5');
  if (who !== null && who < 13)
    add({ id: 'who5', title: 'Низкое самочувствие по WHO-5', text: 'Сырой балл WHO-5 ниже 13 — по руководству ВОЗ это повод проверить настроение подробнее. Пройдите PHQ-9.', tests: ['phq-9'], basis: 'Руководство по WHO-5: балл ниже 13 — основание для тестирования на депрессию.' });
  const pc = scale('pc-ptsd-5');
  if (pc !== null && pc >= 3)
    add({ id: 'pcptsd', title: 'Подробно о последствиях травмы', text: 'В PC-PTSD-5 набрано 3 балла или больше. Подробный опросник — PCL-5; результат обсудите со специалистом по травме.', tests: ['pcl-5'], basis: 'Национальный центр по изучению ПТСР (США): положительный скрининг требует дальнейшей оценки, например PCL-5.' });
  const phq15 = scale('phq-15');
  if (phq15 !== null && phq15 >= 10)
    add({ id: 'phq15', title: 'Телесные жалобы и настроение', text: 'Телесные симптомы выражены заметно. Они часто идут вместе с депрессией и тревогой, поэтому стоит оценить и их — PHQ-9 и GAD-7. Физические причины при этом исключает врач.', tests: ['phq-9', 'gad-7'], basis: 'Kroenke и др., 2002: соматические симптомы тесно связаны с депрессией и тревогой.' });
  if (flagged('cesd') || flagged('gds-15'))
    add({ id: 'cesd', title: 'Сверить оценку депрессии', text: 'Скрининг депрессии на пороге или выше. Для сопоставления пройдите PHQ-9 — это самый употребительный опросник с чёткими порогами.', tests: ['phq-9'], basis: 'Сопоставление нескольких инструментов повышает надёжность оценки (мультиметодный подход).' });
  const d = latest.get('dass-21')?.scales;
  if (d) {
    const lvl = (id: string) => d.find((x) => x.id === id)?.range?.level;
    if (lvl('d') === 'high' || lvl('d') === 'severe') add({ id: 'dass-d', title: 'Депрессия по DASS-21', text: 'Шкала депрессии DASS-21 повышена. Сверьте с PHQ-9.', tests: ['phq-9'], basis: 'Сопоставление нескольких инструментов повышает надёжность оценки.' });
    if (lvl('a') === 'high' || lvl('a') === 'severe') add({ id: 'dass-a', title: 'Тревога по DASS-21', text: 'Шкала тревоги DASS-21 повышена. Сверьте с GAD-7.', tests: ['gad-7'], basis: 'Сопоставление нескольких инструментов повышает надёжность оценки.' });
  }
  const aud = scale('audit');
  if (aud !== null && aud >= 8)
    add({ id: 'audit', title: 'Алкоголь и настроение', text: 'Результат AUDIT указывает на рискованное употребление. Проблемы с алкоголем и депрессия часто сочетаются, поэтому стоит оценить настроение — PHQ-9.', tests: ['phq-9'], basis: 'Boden & Fergusson, 2011: употребление алкоголя и депрессия тесно связаны.' });
  const p9 = scale('phq-9');
  const g7 = scale('gad-7');
  if ((p9 !== null && p9 >= 10) || (g7 !== null && g7 >= 10))
    add({ id: 'flex', title: 'Как вы справляетесь с тяжёлыми переживаниями', text: 'При повышенных симптомах полезно посмотреть на процессы, на которые направлена терапия: избегание переживаний и слияние с мыслями (AAQ-II и CFQ-7).', tests: ['aaq-ii', 'cfq-7'], basis: 'Hayes и др., 2006; Bond и др., 2011: психологическая негибкость — общий для многих расстройств процесс.' });
  if (rows.some((r) => r.flagged) && !['who-5', 'swls', 'flourishing', 'brs', 'scs-sf', 'rosenberg-self-esteem'].some(has))
    add({ id: 'resources', title: 'Не только симптомы, но и ресурсы', text: 'В профиле есть повышенные симптомы, но нет данных о ресурсах. Оценка сильных сторон — устойчивости, отношения к себе — делает картину полной.', tests: ['brs', 'scs-sf', 'who-5'], basis: 'Wood & Tarrier, 2010: в клинической оценке важны и сильные стороны, а не только дефициты.' });
  return out;
}
