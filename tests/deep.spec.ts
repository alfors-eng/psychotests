import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { computeDeep, DIMENSIONS, type DimensionDef } from '../lib/deep';
import { buildDeepInsights } from '../lib/deepInsights';
import type { HistoryEntry, TestDef } from '../lib/types';

const dir = path.join(process.cwd(), 'data', 'tests');
const allTests: TestDef[] = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as TestDef)
  .filter((t) => t.status !== 'draft' && t.status !== 'reference');
const byId = (id: string) => allTests.find((t) => t.id === id)!;

const entry = (testId: string, answers: Record<string, number>): HistoryEntry => ({
  id: `h-${testId}`,
  testId,
  testTitle: testId,
  completedAt: '2026-01-01T00:00:00.000Z',
  answers,
});
const fill = (t: TestDef, f: (i: number) => number) => Object.fromEntries(t.questions.map((q, i) => [q.id, f(i)]));
const mid = (t: TestDef) => {
  const v = t.scale.options.map((o) => o.value).sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
};

test.describe('глубинный анализ: покрытие', () => {
  test('все пункты всех готовых тестов входят в модель', () => {
    const history = allTests.map((t) => entry(t.id, fill(t, () => mid(t))));
    const r = computeDeep({ tests: allTests, history });
    expect(r.coverage.unmapped).toEqual([]);
    expect(r.coverage.itemsUsed).toBe(r.coverage.itemsAnswered);
    expect(r.coverage.testsUsed).toBe(allTests.length);
    // все измерения получили оценку, так как есть все тесты
    expect(r.dims.filter((d) => d.theta === null).map((d) => d.def.id)).toEqual([]);
    // число пунктов = пункты всех тестов без «филлеров»
    const expected = allTests.reduce((a, t) => a + t.questions.filter((q) => !q.filler).length, 0);
    expect(r.coverage.itemsAnswered).toBe(expected);
  });

  test('все пункты влияют хотя бы на одно измерение (в том числе каждый тест)', () => {
    const history = allTests.map((t) => entry(t.id, fill(t, () => mid(t))));
    const r = computeDeep({ tests: allTests, history });
    const used = new Set(r.dims.flatMap((d) => d.byTest.map((x) => x.testId)));
    for (const t of allTests) expect(used.has(t.id), `тест ${t.id} не используется`).toBe(true);
  });

  test('исключённые шкалы не участвуют в расчёте', () => {
    const t = byId('phq-9');
    const history = [entry(t.id, fill(t, () => 3))];
    const all = computeDeep({ tests: allTests, history });
    expect(all.by.DIST.theta).toBeGreaterThan(90);
    const none = computeDeep({ tests: allTests, history, include: () => false });
    expect(none.by.DIST.theta).toBeNull();
    expect(none.coverage.itemsAnswered).toBe(0);
    expect(none.coverage.excludedScales).toBe(1);
  });
});

test.describe('глубинный анализ: объединение оценок', () => {
  test('один тест: итог по пунктам, интервал по ошибке ответа, I² не определён', () => {
    const t = byId('ipip-big5-50');
    const r = computeDeep({ tests: allTests, history: [entry(t.id, fill(t, () => 3))] });
    const e = r.by.E;
    expect(e.theta).toBeCloseTo(50, 5);
    expect(e.tests).toBe(1);
    expect(e.i2).toBeNull();
    // SE = 15 / sqrt(10) ≈ 4.743 → ±9.3
    expect(e.lo!).toBeGreaterThan(40);
    expect(e.lo!).toBeLessThan(41.5);
    expect(e.indirect).toBe(false);
  });

  test('два согласующихся теста дают малую неоднородность', () => {
    const a = byId('ipip-big5-50');
    const b = byId('mini-ipip');
    const r = computeDeep({ tests: allTests, history: [entry(a.id, fill(a, () => 3)), entry(b.id, fill(b, () => 3))] });
    expect(r.by.E.tests).toBe(2);
    expect(r.by.E.i2).toBeLessThan(5);
    expect(r.by.E.theta).toBeCloseTo(50, 3);
  });

  test('расходящиеся тесты: высокая I², итог между оценками', () => {
    const a = byId('ipip-big5-50');
    const b = byId('mini-ipip');
    // Mini-IPIP: все пункты экстраверсии ведут к максимуму (прямые = 5, обратные = 1), остальное нейтрально
    const miniAns = { ...fill(b, () => 3), q1: 5, q6: 1, q11: 5, q16: 1 };
    const r = computeDeep({ tests: allTests, history: [entry(a.id, fill(a, () => 3)), entry(b.id, miniAns)] });
    const e = r.by.E;
    expect(e.byTest.map((x) => Math.round(x.theta)).sort()).toEqual(['100', '50'].map(Number).sort());
    expect(e.i2!).toBeGreaterThan(90);
    expect(e.theta!).toBeGreaterThan(65);
    expect(e.theta!).toBeLessThan(85);
    // при большой неоднородности интервал шире, чем при одном тесте
    expect(e.hi! - e.lo!).toBeGreaterThan(30);
    const ins = buildDeepInsights(r);
    expect(ins.some((i) => i.id === 'hetero')).toBe(true);
  });

  test('косвенная оценка: измерение без прямой шкалы помечается', () => {
    // «Эмоциональная устойчивость» имеет прямые шкалы; если есть только PHQ-9 — оценка косвенная
    const t = byId('phq-9');
    const r = computeDeep({ tests: allTests, history: [entry(t.id, fill(t, () => 3))] });
    expect(r.by.ES.theta).not.toBeNull();
    expect(r.by.ES.indirect).toBe(true);
    expect(r.by.DIST.indirect).toBe(false);
  });

  test('пункты-«отвлекающие» (LOT-R) не участвуют', () => {
    const t = byId('lot-r');
    const r = computeDeep({ tests: allTests, history: [entry(t.id, fill(t, () => 4))] });
    expect(r.coverage.itemsAnswered).toBe(6);
  });

  test('пунктовые нагрузки: пункт PHQ-9 о самооценке влияет на CSE, остальные — нет', () => {
    const t = byId('phq-9');
    const r = computeDeep({ tests: allTests, history: [entry(t.id, fill(t, () => 3))] });
    const items = r.by.CSE.byTest.find((x) => x.testId === 'phq-9');
    expect(items?.k).toBe(1);
    const lowpa = r.by.LOWPA.byTest.find((x) => x.testId === 'phq-9');
    expect(lowpa?.k).toBe(9);
  });
});

/** Синтетические тесты для проверки геометрии круга и метачерт. */
function synthetic(id: string, value: number) {
  const t: TestDef = {
    id,
    title: id,
    shortDescription: '',
    fullDescription: '',
    category: 'personality',
    tags: [],
    duration: 1,
    questionCount: 4,
    author: '',
    year: 2000,
    source: '',
    license: '',
    instructions: '',
    scale: { type: 'likert', options: [1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) })) },
    questions: [1, 2, 3, 4].map((i) => ({ id: `q${i}`, text: `q${i}` })),
    scoring: { method: 'sum' },
    interpretation: { total: [{ min: 4, max: 20, title: '', description: '' }] },
    isClinical: false,
  };
  return { t, e: entry(id, fill(t, () => value)) };
}

test.describe('глубинный анализ: производные структуры', () => {
  const dims = (): DimensionDef[] => [
    { id: 'AGEN', group: 'social', title: 'A', low: '', high: '', refs: [], loadings: [{ t: 'a', s: 'total', l: 1, b: 'def' }] },
    { id: 'COMM', group: 'social', title: 'C', low: '', high: '', refs: [], loadings: [{ t: 'b', s: 'total', l: 1, b: 'def' }] },
  ];
  const run = (agency: number, communion: number) => {
    const a = synthetic('a', agency);
    const b = synthetic('b', communion);
    return computeDeep({ tests: [a.t, b.t], history: [a.e, b.e], dimensions: dims(), itemLoadings: [] });
  };

  test('сектора круга Виггинса', () => {
    expect(run(5, 3).circumplex!.octant!.code).toBe('PA'); // доминантный, нейтральная теплота
    expect(run(3, 5).circumplex!.octant!.code).toBe('LM'); // тёплый
    expect(run(1, 1).circumplex!.octant!.code).toBe('FG'); // холодный и подчинённый
    expect(run(5, 5).circumplex!.octant!.code).toBe('NO'); // тёплый и доминантный
    expect(run(1, 5).circumplex!.octant!.code).toBe('JK'); // тёплый и подчинённый
    expect(run(5, 1).circumplex!.octant!.code).toBe('BC'); // холодный и доминантный
    expect(run(3, 3).circumplex!.octant).toBeNull(); // центр: без выраженного уклона
  });

  test('модель описана без дублей и со ссылками на литературу', () => {
    const ids = DIMENSIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of DIMENSIONS) expect(d.loadings.length).toBeGreaterThan(0);
  });
});
