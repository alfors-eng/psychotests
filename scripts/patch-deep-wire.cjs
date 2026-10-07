// Одноразовый патч: подключить «Глубинный анализ» к профилю и страницам.
const fs = require('fs');
const edit = (file, pairs) => {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(file + ' нет: ' + String(a).slice(0, 70));
    s = s.replace(a, b);
  }
  fs.writeFileSync(file, s);
};

edit('lib/tests.ts', [
  ['export function toScoringDef(t: TestDef): TestDef {', 'export function toScoringDef(t: TestDef, keepQuestionText = false): TestDef {'],
  ["questions: t.questions.map((q) => ({ ...q, text: '' })),", "questions: t.questions.map((q) => ({ ...q, text: keepQuestionText ? q.text : '' })),"],
]);
edit('app/profile/page.tsx', [['.map(toScoringDef);', '.map((t) => toScoringDef(t, true));']]);

edit('components/ProfileView.tsx', [
  ["import CategoryIcon from '@/components/CategoryIcon';", "import CategoryIcon from '@/components/CategoryIcon';\nimport DeepView from '@/components/DeepView';"],
  ["import type { ScaleResult, TestDef } from '@/lib/types';", "import type { HistoryEntry, ScaleResult, TestDef } from '@/lib/types';"],
  ["  const [tab, setTab] = useState<'whole' | 'tables' | 'charts'>('whole');", "  const [tab, setTab] = useState<'whole' | 'deep' | 'tables' | 'charts'>('whole');\n  const [history, setHistory] = useState<HistoryEntry[]>([]);"],
  ["    setChars(buildCharacteristics(tests, loadHistory()));", "    const h = loadHistory();\n    setHistory(h);\n    setChars(buildCharacteristics(tests, h));"],
  ["    { id: 'whole', label: 'Целостная картина' },", "    { id: 'whole', label: 'Целостная картина' },\n    { id: 'deep', label: 'Глубинный анализ' },"],
  ["          <div id=\"panel-tables\" role=\"tabpanel\"", "          <div id=\"panel-deep\" role=\"tabpanel\" aria-labelledby=\"tab-deep\" hidden={tab !== 'deep'} className=\"space-y-6\">\n            <h2 className=\"text-xl font-semibold\">Глубинный анализ ответов</h2>\n            {tab === 'deep' && (\n              <DeepView\n                tests={tests}\n                history={history}\n                include={include}\n                screeningsOff={chars.some((c) => c.isClinical && !isOn(c))}\n                onEnableScreenings={() => setMany((c) => (c.isClinical ? true : isOn(c)))}\n              />\n            )}\n          </div>\n\n          <div id=\"panel-tables\" role=\"tabpanel\""],
  ["  const selected = useMemo(", "  const include = useCallback(\n    (key: string) => {\n      const c = (chars ?? []).find((x) => x.key === key);\n      return c ? (over[c.key] ?? !c.isClinical) : true;\n    },\n    [chars, over],\n  );\n  const selected = useMemo("],
  ["import { useEffect, useMemo, useState } from 'react';", "import { useCallback, useEffect, useMemo, useState } from 'react';"],
]);
console.log('ok');
