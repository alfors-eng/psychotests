import type {
  Answers,
  InterpretationRange,
  SafetyOutcome,
  ScaleResult,
  ScoreResult,
  TestDef,
} from './types';

/** Границы шкалы ответов. */
export function scaleBounds(test: TestDef): { min: number; max: number } {
  const vals = test.scale.options.map((o) => o.value);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

/** Значение ответа с учётом обратного ключа. */
export function keyedValue(test: TestDef, questionId: string, raw: number): number {
  const q = test.questions.find((x) => x.id === questionId);
  // Дихотомический ключ (AQ-10 и т.п.): 1 балл, если ответ входит в scoreWhen.
  if (q?.scoreWhen) return q.scoreWhen.includes(raw) ? 1 : 0;
  if (!q?.reversed) return raw;
  const { min, max } = scaleBounds(test);
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
  const { min: smin, max: smax } = scaleBounds(test);
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
    const lo = (q: (typeof g.qs)[number]) => (q.scoreWhen ? 0 : smin);
    const hi = (q: (typeof g.qs)[number]) => (q.scoreWhen ? 1 : smax);
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
