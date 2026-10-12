const fs = require('fs');
const rw = (p, f) => { const s = fs.readFileSync(p, 'utf8'); const t = f(s); if (s === t) console.log('NO CHANGE', p); fs.writeFileSync(p, t); };
const rep = (s, a, b) => { if (!s.includes(a)) { console.log('NOT FOUND:', a.slice(0, 70)); return s; } return s.replace(a, b); };

rw('lib/types.ts', (s) => rep(s, "  /** Пункт показывается, но в подсчёт не входит (например, «отвлекающие» пункты LOT-R). */\n  filler?: boolean;\n}",
"  /** Пункт показывается, но в подсчёт не входит (например, «отвлекающие» пункты LOT-R). */\n  filler?: boolean;\n  /** Собственные варианты ответа пункта (если отличаются от scale.options), как у AUDIT. */\n  options?: ScaleOption[];\n}"));

rw('lib/engine.ts', (s) => {
  s = rep(s, "import type {\n  Answers,\n  InterpretationRange,", "import type {\n  Answers,\n  InterpretationRange,\n  Question,\n  ScaleOption,");
  s = rep(s, `/** Границы шкалы ответов. */
export function scaleBounds(test: TestDef): { min: number; max: number } {
  const vals = test.scale.options.map((o) => o.value);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}`, `/** Варианты ответа пункта: собственные (как у AUDIT) или общие для теста. */
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
}`);
  s = rep(s, "  const { min, max } = scaleBounds(test);\n  return min + max - raw;", "  const { min, max } = questionBounds(test, q);\n  return min + max - raw;");
  s = rep(s, "    const lo = (q: (typeof g.qs)[number]) => (q.scoreWhen ? 0 : smin);\n    const hi = (q: (typeof g.qs)[number]) => (q.scoreWhen ? 1 : smax);",
             "    const lo = (q: (typeof g.qs)[number]) => (q.scoreWhen ? 0 : questionBounds(test, q).min);\n    const hi = (q: (typeof g.qs)[number]) => (q.scoreWhen ? 1 : questionBounds(test, q).max);");
  s = rep(s, "  const { min: smin, max: smax } = scaleBounds(test);\n  const { method } = test.scoring;", "  const { min: smin } = scaleBounds(test);\n  const { method } = test.scoring;");
  return s;
});

rw('lib/analytics.ts', (s) => {
  s = rep(s, "import { keyedValue, scaleBounds } from './engine';", "import { allOptions, hasOwnOptions, keyedValue, questionBounds, questionOptions, scaleBounds } from './engine';");
  s = rep(s, "  const opts = test.scale.options;\n", "  const own = hasOwnOptions(test);\n  // У тестов с разными вариантами у пунктов в распределении показываем баллы, а не подписи.\n  const opts = own ? allOptions(test).map((o) => ({ value: o.value, label: `Балл ${o.value}` })) : test.scale.options;\n");
  s = rep(s, "    const percent = q.scoreWhen ? keyed * 100 : smax === smin ? 0 : ((keyed - smin) / (smax - smin)) * 100;",
             "    const qb = questionBounds(test, q);\n    const percent = q.scoreWhen ? keyed * 100 : qb.max === qb.min ? 0 : ((keyed - qb.min) / (qb.max - qb.min)) * 100;");
  s = rep(s, "      answerLabel: opts.find((o) => o.value === raw)?.label ?? String(raw),", "      answerLabel: questionOptions(test, q).find((o) => o.value === raw)?.label ?? String(raw),");
  s = rep(s, "  const ends = opts.length >= 3;", "  const ends = !own && opts.length >= 3;");
  s = rep(s, "  const mid = opts.length >= 3 && opts.length % 2 === 1 ? (smin + smax) / 2 : null;", "  const mid = !own && opts.length >= 3 && opts.length % 2 === 1 ? (smin + smax) / 2 : null;");
  return s;
});

rw('lib/deep.ts', (s) => {
  s = rep(s, "import { keyedValue, scaleBounds, scoreTest } from './engine';", "import { keyedValue, questionBounds, questionOptions, scoreTest } from './engine';");
  s = rep(s, "  const { min, max } = scaleBounds(test);\n  const q = test.questions.find((x) => x.id === qid)!;", "  const q = test.questions.find((x) => x.id === qid)!;\n  const { min, max } = questionBounds(test, q);");
  s = rep(s, "answerLabel: t.scale.options.find((o) => o.value === raw)?.label ?? String(raw),", "answerLabel: questionOptions(t, q).find((o) => o.value === raw)?.label ?? String(raw),");
  return s;
});

rw('components/AnswerAnalytics.tsx', (s) => {
  s = rep(s, "import { analyzeAnswers, type ItemStat } from '@/lib/analytics';", "import { analyzeAnswers, type ItemStat } from '@/lib/analytics';\nimport { allOptions } from '@/lib/engine';");
  s = rep(s, "  const opts = [...test.scale.options].sort((a, b) => a.value - b.value);", "  const opts = [...allOptions(test)].sort((a, b) => a.value - b.value);");
  return s;
});

rw('components/Runner.tsx', (s) => {
  s = rep(s, "import { addHistory, clearProgress, loadProgress, saveProgress } from '@/lib/storage';", "import { questionOptions } from '@/lib/engine';\nimport { addHistory, clearProgress, loadProgress, saveProgress } from '@/lib/storage';");
  s = rep(s, "  const options = test.scale.options;\n", "  const options = q ? questionOptions(test, q) : test.scale.options;\n");
  s = rep(s, "      if (/^[0-9]$/.test(e.key)) {\n        const opt = options[Number(e.key) - 1];\n        if (opt) choose(opt.value);\n      }",
             "      if (/^[0-9]$/.test(e.key)) {\n        const cur = test.questions[idxRef.current];\n        const opt = cur ? questionOptions(test, cur)[Number(e.key) - 1] : undefined;\n        if (opt) choose(opt.value);\n      }");
  s = rep(s, "  }, [options, choose, back]);", "  }, [test, choose, back]);");
  return s;
});

rw('lib/validate.ts', (s) => rep(s, "  if (t.scale.options.length < 2) e('в scale меньше двух вариантов');",
`  if (t.scale.options.length < 2) e('в scale меньше двух вариантов');
  for (const q of t.questions) {
    if (!q.options) continue;
    const vals = q.options.map((o) => o.value);
    if (vals.length < 2) e(\`вопрос \${q.id}: в options меньше двух вариантов\`);
    if (new Set(vals).size !== vals.length) e(\`вопрос \${q.id}: повторяющиеся значения в options\`);
  }`));
