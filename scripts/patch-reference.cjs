// Одноразовый патч: статус reference — справочная карточка методики без лицензии (ссылка + открытые аналоги).
const fs = require('fs');
const edit = (file, pairs) => {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(file + ' нет: ' + String(a).slice(0, 70));
    s = s.replace(a, b);
  }
  fs.writeFileSync(file, s);
};

edit('lib/types.ts', [
  [
    "  /** ready — можно проходить; draft — заготовка с метаданными. */\n  status?: 'ready' | 'draft';",
    "  /**\n   * ready — можно проходить; draft — заготовка; reference — справочная карточка известной методики,\n   * которую нельзя воспроизводить: ссылка на официальный источник и открытые аналоги на сайте.\n   */\n  status?: 'ready' | 'draft' | 'reference';\n  /** Для reference: официальный сайт методики. */\n  officialUrl?: string;\n  /** Для reference: кто и на каких условиях распространяет методику. */\n  restriction?: string;\n  /** Для reference: id открытых тестов на сайте, которые можно пройти вместо неё. */\n  analogs?: string[];",
  ],
]);

edit('lib/tests.ts', [
  ["export function isReady(t: { status?: string }) {\n  return t.status !== 'draft';\n}", "export function isReady(t: { status?: string }) {\n  return t.status !== 'draft' && t.status !== 'reference';\n}\n\nexport const isReference = (t: { status?: string }) => t.status === 'reference';"],
]);

edit('lib/validate.ts', [
  ["  if (t.status === 'draft') return errs;", "  if (t.status === 'reference') {\n    if (!t.officialUrl) e('reference: нужен officialUrl');\n    if (!t.restriction) e('reference: нужно описание ограничения (restriction)');\n    return errs;\n  }\n  if (t.status === 'draft') return errs;"],
]);

edit('components/Catalog.tsx', [
  ["  const draft = t.status === 'draft';", "  const draft = t.status === 'draft';\n  const ref = t.status === 'reference';"],
  ["            {draft && <span className=\"rounded-full bg-warm-soft px-2.5 py-1 font-medium text-warm\">Скоро</span>}", "            {draft && <span className=\"rounded-full bg-warm-soft px-2.5 py-1 font-medium text-warm\">Скоро</span>}\n            {ref && <span className=\"rounded-full border border-line px-2.5 py-1 font-medium text-muted\">Ссылка</span>}"],
  ["{!draft && t.mode === 'external' && (", "{!draft && !ref && t.mode === 'external' && ("],
  ["{t.isClinical && !draft && (", "{t.isClinical && !draft && !ref && ("],
  ["  const popular = tests.filter((t) => t.popular && t.status !== 'draft');", "  const popular = tests.filter((t) => t.popular && t.status !== 'draft' && t.status !== 'reference');"],
]);

edit('app/about/page.tsx', [["{!isReady(t) && <span className=\"text-muted\"> (в подготовке)</span>}", "{!isReady(t) && <span className=\"text-muted\"> ({t.status === 'reference' ? 'справочная карточка' : 'в подготовке'})</span>}"]]);
console.log('ok');
