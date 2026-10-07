// Одноразовый патч: режим «ввод ответов с сайта оригинала» (mode: "external").
const fs = require('fs');
const edit = (file, pairs) => {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(`не найдено в ${file}: ${a.slice(0, 60)}`);
    s = s.replace(a, b);
  }
  fs.writeFileSync(file, s);
};

edit('lib/types.ts', [
  [
    '  /** Двумерная плоскость',
    "  /**\n   * interactive (по умолчанию) — вопросы проходятся на сайте. external — вопросы не воспроизводятся:\n   * пользователь проходит тест на сайте оригинала и вводит номера ответов, а сайт считает результат.\n   */\n  mode?: 'interactive' | 'external';\n  external?: ExternalInfo;\n  /** Двумерная плоскость",
  ],
]);
fs.appendFileSync(
  'lib/types.ts',
  `
export interface ExternalInfo {
  url: string;
  urlLabel: string;
  /** Пояснение, как пройти тест на сайте оригинала. */
  note: string;
}
`,
);

edit('lib/validate.ts', [
  [
    "  if (t.plane) {",
    "  if (t.mode === 'external' && (!t.external?.url || !t.external.note)) e('external: нужны url и note');\n  if (t.plane) {",
  ],
]);

edit('app/tests/[id]/page.tsx', [
  [
    "      {ready ? (\n        <StartButtons testId={t.id} />",
    "      {ready && t.mode === 'external' ? (\n        <section className=\"card space-y-3\">\n          <h2 className=\"text-lg font-semibold\">Как это работает</h2>\n          <ol className=\"list-decimal space-y-1 pl-5 text-[15px]\">\n            <li>Пройдите тест на сайте оригинала (мы не воспроизводим его вопросы).</li>\n            <li>Вернитесь и введите номера своих ответов.</li>\n            <li>Получите баллы и объяснение: подсчёт идёт в вашем браузере.</li>\n          </ol>\n          <Link href={`/tests/${t.id}/run`} className=\"btn btn-primary\">\n            Ввести ответы\n          </Link>\n        </section>\n      ) : ready ? (\n        <StartButtons testId={t.id} />",
  ],
]);

edit('app/tests/[id]/run/page.tsx', [
  ["import Runner from '@/components/Runner';", "import ExternalEntry from '@/components/ExternalEntry';\nimport Runner from '@/components/Runner';"],
  ['  return <Runner test={t} />;', "  return t.mode === 'external' ? <ExternalEntry test={t} /> : <Runner test={t} />;"],
]);

edit('components/Catalog.tsx', [
  [
    '          {draft && <span',
    '          {!draft && t.mode === \'external\' && (\n            <span className="rounded-full bg-warm-soft px-2.5 py-1 font-medium text-warm">Ввод ответов</span>\n          )}\n          {draft && <span',
  ],
]);
console.log('patched');
