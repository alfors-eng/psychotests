import type {
  Answers,
  InterpretationRange,
  Question,
  ScaleOption,
  SafetyOutcome,
  ScaleResult,
  ScoreResult,
  TestDef,
} from './types';

/** Варианты ответа пункта: собственные (как у AUDIT) или общие для теста. */
export function questionOptions(test: TestDef, q: Question): ScaleOption[] {
  return q.options?.length ? q.options : test.scale.options;
}

/** Все варианты теста по значениям: объединение общих и собственных вариантов пунктов. */
export function allOptions(test: TestDef): ScaleOption[] {
  if (!test.questions.some((q) => q.options?.length)) return test.scale.options;
  const byValue = new Map<number, ScaleOption>();
  for (const o of test.scale.options) byValue.set(o.value, o);
  for (const q of test.questions) for (const o of q.options ?? []) if (!byValue.has(o.value)) byValue.set(o.value, o);
  return [...byValue.values()].sort((a, b) => a.value - b.value);
}

/** Тест, у пунктов которого разные наборы вариантов ответа. */
export const hasOwnOptions = (test: TestDef) => test.questions.some((q) => q.options?.length);

/** Границы шкалы ответов (по всем вариантам теста). */
export function scaleBounds(test: TestDef): { min: number; max: number } {
  const vals = allOptions(test).map((o) => o.value);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

/** Границы ответов конкретного пункта. */
export function questionBounds(test: TestDef, q: Question): { min: number; max: number } {
  const vals = questionOptions(test, q).map((o) => o.value);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

/** Значение ответа с учётом обратного ключа. */
export function keyedValue(test: TestDef, questionId: string, raw: number): number {
  const q = test.questions.find((x) => x.id === questionId);
  // Дихотомический ключ (AQ-10 и т.п.): 1 балл, если ответ входит в scoreWhen.
  if (q?.scoreWhen) return q.scoreWhen.includes(raw) ? 1 : 0;
  if (!q?.reversed) return raw;
  const { min, max } = questionBounds(test, q);
  return min + max - raw;
}

/** Диапазон интерпретации: последний, у которого min <= value. */
export function pickRange(
  ranges: InterpretationRange[] | undefined,
  value: number,
): InterpretationRange | undefined {
  if (!ranges?.length) return undefined;
  const sorted = [...ranges].sort((a, b) => a.min - b.min);
  let found = sorted[0];
  for (const r of sorted) if (value + 1e-9 >= r.min) found = r;
  return found;
}

export function scoreTest(test: TestDef, answers: Answers): ScoreResult {
  const { min: smin } = scaleBounds(test);
  const { method } = test.scoring;
  const aggregate = method === 'average' ? 'average' : (test.scoring.aggregate ?? 'sum');

  const groups: { id: string; title: string; description?: string; qs: typeof test.questions }[] =
    method === 'sum' || method === 'average'
      ? [{ id: 'total', title: test.scoring.totalTitle ?? 'Общий балл', qs: test.questions.filter((q) => !q.filler) }]
      : (test.scoring.subscales ?? []).map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          qs: test.questions.filter((q) => q.subscale === s.id),
        }));

  const scales: ScaleResult[] = groups.map((g) => {
    const answered = g.qs.filter((q) => answers[q.id] !== undefined);
    const sum = answered.reduce((acc, q) => acc + keyedValue(test, q.id, answers[q.id]), 0);
    const n = g.qs.length;
    const value = aggregate === 'average' ? (answered.length ? sum / answered.length : smin) : sum;
    const lo = (q: (typeof g.qs)[number]) => (q.scoreWhen ? 0 : questionBounds(test, q).min);
    const hi = (q: (typeof g.qs)[number]) => (q.scoreWhen ? 1 : questionBounds(test, q).max);
    const sumLo = g.qs.reduce((a, q) => a + lo(q), 0);
    const sumHi = g.qs.reduce((a, q) => a + hi(q), 0);
    const min = aggregate === 'average' ? sumLo / (n || 1) : sumLo;
    const max = aggregate === 'average' ? sumHi / (n || 1) : sumHi;
    const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      value,
      min,
      max,
      percent: Math.max(0, Math.min(100, percent)),
      answered: answered.length,
      total: n,
      range: pickRange(test.interpretation[g.id], value),
    };
  });

  let dominant: string[] = [];
  if (method === 'typeMax' && scales.length) {
    const top = Math.max(...scales.map((s) => s.value));
    dominant = scales.filter((s) => Math.abs(s.value - top) < 1e-9).map((s) => s.id);
  }

  return { scales, dominant, complete: test.questions.every((q) => answers[q.id] !== undefined) };
}

export function evaluateSafety(test: TestDef, answers: Answers, result: ScoreResult): SafetyOutcome {
  const s = test.safety;
  if (!s) return { showHelp: false, crisis: false };
  const crisis = (s.crisisQuestions ?? []).some(
    (c) => answers[c.questionId] !== undefined && answers[c.questionId] > c.above,
  );
  const rules = s.helpAboveScore ? [s.helpAboveScore].flat() : [];
  const high = rules.some((r) => {
    const sc = result.scales.find((x) => x.id === r.scale);
    if (!sc) return false;
    return (r.min !== undefined && sc.value >= r.min) || (r.max !== undefined && sc.value <= r.max);
  });
  return { crisis, showHelp: crisis || high };
}

export const formatValue = (v: number) =>
  Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
