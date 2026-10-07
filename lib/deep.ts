import data from '../data/dimensions.json';
import { keyedValue, scaleBounds, scoreTest } from './engine';
import type { Answers, CategoryId, HistoryEntry, TestDef } from './types';

/* ------------------------------------------------------------------ */
/* Модель: измерения, группы, литература                               */
/* ------------------------------------------------------------------ */

export type Basis = 'def' | 'lit' | 'cnt';

export interface Loading {
  t: string;
  s: string;
  l: number;
  b: Basis;
}

export interface DimensionDef {
  id: string;
  group: string;
  title: string;
  low: string;
  high: string;
  refs: string[];
  /** Составное измерение: оценивается по близким по смыслу шкалам, прямой шкалы нет по определению. */
  composite?: boolean;
  loadings: Loading[];
}

export interface GroupDef {
  id: string;
  title: string;
  category: CategoryId;
}

export interface Reference {
  id: string;
  cite: string;
  use: string;
}

export interface ItemLoading {
  t: string;
  i: string;
  d: string;
  l: number;
  b: Basis;
  why: string;
}

export const DIMENSIONS = data.dimensions as DimensionDef[];
export const GROUPS = data.groups as GroupDef[];
export const REFERENCES = data.references as Reference[];
export const ITEM_LOADINGS = data.itemLoadings as ItemLoading[];

/* ------------------------------------------------------------------ */
/* Результаты                                                          */
/* ------------------------------------------------------------------ */

export interface ItemEvidence {
  testId: string;
  short: string;
  scaleId: string;
  qid: string;
  index: number;
  text: string;
  answerLabel: string;
  /** Положение пункта в направлении его шкалы, 0–100 (с учётом обратного ключа). */
  p: number;
  /** То же в направлении измерения (с учётом знака нагрузки). */
  o: number;
  w: number;
  basis: Basis;
}

export interface TestEstimate {
  testId: string;
  short: string;
  theta: number;
  k: number;
  neff: number;
  /** Дисперсия оценки (с нижней границей на ошибку ответа). */
  v: number;
}

export interface DimEstimate {
  def: DimensionDef;
  theta: number | null;
  lo: number | null;
  hi: number | null;
  se: number | null;
  /** Оценка по всем пунктам без разделения на тесты. */
  pooled: number | null;
  tau2: number;
  /** Доля различий между тестами, не объяснимая случайной погрешностью (0–100), или null при одном тесте. */
  i2: number | null;
  k: number;
  neff: number;
  tests: number;
  byTest: TestEstimate[];
  /** Все нагрузки у пунктов только по литературе/содержанию (нет прямой шкалы). */
  indirect: boolean;
  precision: 'none' | 'low' | 'medium' | 'high';
  support: ItemEvidence[];
  tension: ItemEvidence[];
}

export interface Coverage {
  testsUsed: number;
  itemsAnswered: number;
  itemsUsed: number;
  /** Пункты, которые не вошли ни в одно измерение (должно быть 0 для готовых тестов). */
  unmapped: { testId: string; qid: string }[];
  excludedScales: number;
}

export interface Octant {
  index: number;
  code: string;
  label: string;
}

export interface DeepResult {
  dims: DimEstimate[];
  by: Record<string, DimEstimate>;
  coverage: Coverage;
  bigTwo: { stability: number | null; plasticity: number | null; stabilitySe: number | null; plasticitySe: number | null };
  circumplex: { agency: number; communion: number; angle: number; radius: number; octant: Octant | null } | null;
  blockType: 'resilient' | 'overcontrolled' | 'undercontrolled' | 'mixed' | null;
}

export const LEVEL_LOW = 35;
export const LEVEL_HIGH = 65;
/** Нижняя граница стандартного отклонения ответов: пункты никогда не бывают абсолютно «точными». */
const SD_FLOOR = 15;
const Z = 1.96;

export const OCTANTS: Octant[] = [
  { index: 0, code: 'LM', label: 'Тёпло-доброжелательный' },
  { index: 1, code: 'NO', label: 'Общительно-экстравертный' },
  { index: 2, code: 'PA', label: 'Уверенно-доминантный' },
  { index: 3, code: 'BC', label: 'Самоуверенно-расчётливый' },
  { index: 4, code: 'DE', label: 'Холодно-жёсткий' },
  { index: 5, code: 'FG', label: 'Отстранённо-замкнутый' },
  { index: 6, code: 'HI', label: 'Неуверенно-подчинённый' },
  { index: 7, code: 'JK', label: 'Скромно-простодушный' },
];

const clamp = (v: number) => Math.max(0, Math.min(100, v));

/* ------------------------------------------------------------------ */
/* Расчёт                                                              */
/* ------------------------------------------------------------------ */

function shortOf(t: TestDef): string {
  if (t.shortName) return t.shortName;
  const lead = t.title.match(/^([A-Za-z][A-Za-z0-9-]*)\s+[—–-]\s/);
  if (lead) return lead[1];
  const parens = [...t.title.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].split(',')[0].trim()).filter((x) => /[A-Za-z0-9]/.test(x));
  if (parens.length) return parens[parens.length - 1];
  const code = t.title.match(/\b[A-Z][A-Za-z]*-?[A-Z0-9][A-Za-z0-9-]*\b/);
  return code ? code[0] : t.title.split(/\s+/).pop()!;
}

function itemPercent(test: TestDef, qid: string, raw: number): number {
  const { min, max } = scaleBounds(test);
  const q = test.questions.find((x) => x.id === qid)!;
  const keyed = keyedValue(test, qid, raw);
  if (q.scoreWhen) return keyed * 100;
  return max === min ? 0 : clamp(((keyed - min) / (max - min)) * 100);
}

function scaleOf(test: TestDef, q: { subscale?: string }): string {
  return test.scoring.method === 'sum' || test.scoring.method === 'average' ? 'total' : (q.subscale ?? '');
}

export interface DeepInput {
  tests: TestDef[];
  history: HistoryEntry[];
  /** Какие шкалы учитывать (ключ «тест:шкала»). */
  include?: (key: string) => boolean;
  dimensions?: DimensionDef[];
  itemLoadings?: ItemLoading[];
}

export function computeDeep({ tests, history, include = () => true, dimensions = DIMENSIONS, itemLoadings = ITEM_LOADINGS }: DeepInput): DeepResult {
  const byId = new Map(tests.map((t) => [t.id, t]));
  const latest = new Map<string, HistoryEntry>();
  for (const h of history) {
    const prev = latest.get(h.testId);
    if (byId.has(h.testId) && (!prev || h.completedAt > prev.completedAt)) latest.set(h.testId, h);
  }

  // Нагрузки: шкала → [(измерение, нагрузка, основание)], пункт → переопределения.
  const scaleLoads = new Map<string, { dim: string; l: number; b: Basis }[]>();
  for (const d of dimensions) {
    for (const x of d.loadings) {
      const k = `${x.t}:${x.s}`;
      scaleLoads.set(k, [...(scaleLoads.get(k) ?? []), { dim: d.id, l: x.l, b: x.b }]);
    }
  }
  const itemLoads = new Map<string, ItemLoading[]>();
  for (const x of itemLoadings) itemLoads.set(`${x.t}:${x.i}`, [...(itemLoads.get(`${x.t}:${x.i}`) ?? []), x]);

  const evidence = new Map<string, ItemEvidence[]>(dimensions.map((d) => [d.id, []]));
  let itemsAnswered = 0;
  let itemsUsed = 0;
  let excludedScales = 0;
  let testsUsed = 0;
  const unmapped: { testId: string; qid: string }[] = [];

  for (const [testId, entry] of latest) {
    const t = byId.get(testId)!;
    if (!scoreTest(t, entry.answers).complete) continue;
    const short = shortOf(t);
    let usedInTest = 0;
    const skipped = new Set<string>();
    t.questions.forEach((q, qi) => {
      if (q.filler || entry.answers[q.id] === undefined) return;
      const sid = scaleOf(t, q);
      if (!include(`${testId}:${sid}`)) {
        skipped.add(sid);
        return;
      }
      itemsAnswered += 1;
      const raw = (entry.answers as Answers)[q.id];
      const p = itemPercent(t, q.id, raw);
      const loads = new Map<string, { l: number; b: Basis }>();
      for (const x of scaleLoads.get(`${testId}:${sid}`) ?? []) loads.set(x.dim, { l: x.l, b: x.b });
      for (const x of itemLoads.get(`${testId}:${q.id}`) ?? []) loads.set(x.d, { l: x.l, b: x.b });
      if (!loads.size) {
        unmapped.push({ testId, qid: q.id });
        return;
      }
      itemsUsed += 1;
      usedInTest += 1;
      for (const [dim, { l, b }] of loads) {
        evidence.get(dim)?.push({
          testId,
          short,
          scaleId: sid,
          qid: q.id,
          index: qi + 1,
          text: q.text,
          answerLabel: t.scale.options.find((o) => o.value === raw)?.label ?? String(raw),
          p,
          o: l > 0 ? p : 100 - p,
          w: Math.abs(l),
          basis: b,
        });
      }
    });
    excludedScales += skipped.size;
    if (usedInTest) testsUsed += 1;
  }

  const dims = dimensions.map((def) => estimate(def, evidence.get(def.id) ?? []));
  const by = Object.fromEntries(dims.map((d) => [d.def.id, d]));
  const th = (id: string) => by[id]?.theta ?? null;
  const se = (id: string) => by[id]?.se ?? null;

  const mean = (ids: string[]) => {
    const v = ids.map(th).filter((x): x is number => x !== null);
    return v.length >= Math.min(2, ids.length) ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const meanSe = (ids: string[]) => {
    const v = ids.map(se).filter((x): x is number => x !== null);
    return v.length ? Math.sqrt(v.reduce((a, b) => a + b * b, 0)) / v.length : null;
  };

  const agency = th('AGEN');
  const communion = th('COMM');
  let circumplex: DeepResult['circumplex'] = null;
  if (agency !== null && communion !== null) {
    const dx = communion - 50;
    const dy = agency - 50;
    const radius = Math.hypot(dx, dy);
    const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    circumplex = { agency, communion, angle, radius, octant: radius >= 8 ? OCTANTS[Math.round(angle / 45) % 8] : null };
  }

  const es = th('ES');
  const e = th('E');
  const a = th('A');
  const c = th('C');
  let blockType: DeepResult['blockType'] = null;
  if (es !== null && e !== null && a !== null && c !== null) {
    blockType =
      es >= 55 && e >= 45 && a >= 45 && c >= 45
        ? 'resilient'
        : es < 45 && e < 45
          ? 'overcontrolled'
          : c < 45 && a < 45
            ? 'undercontrolled'
            : 'mixed';
  }

  return {
    dims,
    by,
    coverage: { testsUsed, itemsAnswered, itemsUsed, unmapped, excludedScales },
    bigTwo: {
      stability: mean(['ES', 'A', 'C']),
      plasticity: mean(['E', 'O']),
      stabilitySe: meanSe(['ES', 'A', 'C']),
      plasticitySe: meanSe(['E', 'O']),
    },
    circumplex,
    blockType,
  };
}

/** Объединение пунктов одного измерения: внутри теста — среднее по пунктам, между тестами — модель случайных эффектов. */
function estimate(def: DimensionDef, items: ItemEvidence[]): DimEstimate {
  const empty: DimEstimate = {
    def, theta: null, lo: null, hi: null, se: null, pooled: null, tau2: 0, i2: null, k: 0, neff: 0, tests: 0,
    byTest: [], indirect: false, precision: 'none', support: [], tension: [],
  };
  if (!items.length) return empty;

  const groups = new Map<string, ItemEvidence[]>();
  for (const it of items) groups.set(it.testId, [...(groups.get(it.testId) ?? []), it]);

  const byTest: TestEstimate[] = [...groups.entries()].map(([testId, list]) => {
    const W = list.reduce((a, x) => a + x.w, 0);
    const theta = list.reduce((a, x) => a + x.w * x.o, 0) / W;
    const s2 = Math.max(SD_FLOOR * SD_FLOOR, list.reduce((a, x) => a + x.w * (x.o - theta) ** 2, 0) / W);
    const neff = (W * W) / list.reduce((a, x) => a + x.w * x.w, 0);
    return { testId, short: list[0].short, theta, k: list.length, neff, v: s2 / neff };
  });

  const Wall = items.reduce((a, x) => a + x.w, 0);
  const pooled = items.reduce((a, x) => a + x.w * x.o, 0) / Wall;

  let theta: number;
  let se: number;
  let tau2 = 0;
  let i2: number | null = null;
  if (byTest.length === 1) {
    theta = byTest[0].theta;
    se = Math.sqrt(byTest[0].v);
  } else {
    const w = byTest.map((t) => 1 / t.v);
    const sw = w.reduce((a, b) => a + b, 0);
    const fixed = byTest.reduce((a, t, i) => a + w[i] * t.theta, 0) / sw;
    const Q = byTest.reduce((a, t, i) => a + w[i] * (t.theta - fixed) ** 2, 0);
    const df = byTest.length - 1;
    const Cc = sw - w.reduce((a, b) => a + b * b, 0) / sw;
    tau2 = Math.max(0, (Q - df) / Cc);
    i2 = Q > 0 ? Math.max(0, ((Q - df) / Q) * 100) : 0;
    const ws = byTest.map((t) => 1 / (t.v + tau2));
    const sws = ws.reduce((a, b) => a + b, 0);
    theta = byTest.reduce((a, t, i) => a + ws[i] * t.theta, 0) / sws;
    se = Math.sqrt(1 / sws);
  }

  const neff = byTest.reduce((a, t) => a + t.neff, 0);
  const aligned = (x: ItemEvidence) => (x.o - 50) * (theta - 50) >= 0;
  const support = items
    .filter((x) => x.w >= 0.5 && aligned(x))
    .sort((a, b) => Math.abs(b.o - 50) * b.w - Math.abs(a.o - 50) * a.w)
    .slice(0, 4);
  const tension = items
    .filter((x) => x.w >= 0.5 && !aligned(x) && Math.abs(x.o - 50) >= 25)
    .sort((a, b) => Math.abs(b.o - theta) * b.w - Math.abs(a.o - theta) * a.w)
    .slice(0, 4);

  return {
    def,
    theta: clamp(theta),
    lo: clamp(theta - Z * se),
    hi: clamp(theta + Z * se),
    se,
    pooled: clamp(pooled),
    tau2,
    i2,
    k: items.length,
    neff,
    tests: byTest.length,
    byTest,
    indirect: !def.composite && !items.some((x) => x.basis === 'def'),
    precision: neff < 6 ? 'low' : neff < 15 ? 'medium' : 'high',
    support,
    tension,
  };
}

export const levelOf = (theta: number): 'low' | 'mid' | 'high' => (theta < LEVEL_LOW ? 'low' : theta > LEVEL_HIGH ? 'high' : 'mid');
