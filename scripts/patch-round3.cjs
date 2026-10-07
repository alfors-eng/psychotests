// Одноразовый патч: плоскость ECR-R, радар в PNG, SEO-метаданные, скрытие AQ-10.
const fs = require('fs');
const edit = (file, pairs) => {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(`не найдено в ${file}: ${a.slice(0, 40)}`);
    s = s.replace(a, b);
  }
  fs.writeFileSync(file, s);
};

edit('lib/types.ts', [
  [
    '  /** Что осталось проверить/дописать перед публикацией. */',
    '  /** Двумерная плоскость из двух шкал (например, ECR-R): точка и четыре квадранта. */\n  plane?: Plane;\n  /** Что осталось проверить/дописать перед публикацией. */',
  ],
]);
fs.appendFileSync(
  'lib/types.ts',
  `
export interface Plane {
  /** id подшкал по горизонтали и вертикали. */
  x: string;
  y: string;
  xLabel: string;
  yLabel: string;
  /** Граница между «низко» и «высоко» в единицах шкал. */
  split: number;
  /** Квадранты: [низ-лево, низ-право, верх-лево, верх-право]. */
  quadrants: { name: string; description: string }[];
}
`,
);

edit('lib/validate.ts', [
  [
    '  return errs;\n}',
    "  if (t.plane) {\n    for (const id of [t.plane.x, t.plane.y]) if (!scaleIds.includes(id)) e(`plane: неизвестная шкала «${id}»`);\n    if (t.plane.quadrants.length !== 4) e('plane: нужно ровно 4 квадранта');\n  }\n  return errs;\n}",
  ],
]);

const ecr = JSON.parse(fs.readFileSync('data/tests/ecr-r.json', 'utf8'));
ecr.plane = {
  x: 'avo',
  y: 'anx',
  xLabel: 'Избегание близости',
  yLabel: 'Тревожность',
  split: 4,
  quadrants: [
    { name: 'Надёжный стиль', description: 'Низкие тревожность и избегание: вам обычно комфортно и сближаться, и полагаться на партнёра.' },
    { name: 'Отстранённо-избегающий стиль', description: 'Низкая тревожность, высокое избегание: вы склонны сохранять дистанцию и рассчитывать на себя.' },
    { name: 'Тревожно-озабоченный стиль', description: 'Высокая тревожность, низкое избегание: вы стремитесь к близости и сильно переживаете, что вас отвергнут.' },
    { name: 'Тревожно-избегающий стиль', description: 'Высокие тревожность и избегание: вы хотите близости, но опасаетесь её и боитесь быть отвергнутым.' },
  ],
};
ecr.disclaimer =
  'Границы 3 и 5 для шкал и середина шкалы (4) для плоскости — ориентировочные, не нормы. Стиль привязанности — не ярлык и может меняться в разных отношениях и с опытом.';
fs.writeFileSync('data/tests/ecr-r.json', JSON.stringify(ecr, null, 2) + '\n');

const aq = JSON.parse(fs.readFileSync('data/tests/aq-10.json', 'utf8'));
aq.status = 'draft';
aq.todo.unshift('СКРЫТ до письменного подтверждения ARC (Cambridge): права на текст принадлежат университету. Чтобы вернуть тест — status: "ready".');
fs.writeFileSync('data/tests/aq-10.json', JSON.stringify(aq, null, 2) + '\n');

edit('components/ResultView.tsx', [
  ["import { RadarChart, ScaleBar } from '@/components/Charts';", "import { RadarChart, ScaleBar } from '@/components/Charts';\nimport PlaneChart from '@/components/PlaneChart';"],
  [
    '  const date = formatDate(entry.completedAt);',
    '  const date = formatDate(entry.completedAt);\n  const plane = test.plane;\n  const px = plane && result.scales.find((x) => x.id === plane.x);\n  const py = plane && result.scales.find((x) => x.id === plane.y);\n  const quadrant =\n    plane && px && py ? plane.quadrants[(py.value >= plane.split ? 2 : 0) + (px.value >= plane.split ? 1 : 0)] : null;',
  ],
  [
    '      <section aria-labelledby="scores"',
    '      {plane && px && py && quadrant && (\n        <section className="card space-y-3" aria-labelledby="plane-title">\n          <h2 id="plane-title" className="text-xl font-semibold">\n            {quadrant.name}\n          </h2>\n          <PlaneChart plane={plane} xValue={px.value} yValue={py.value} min={px.min} max={px.max} />\n          <p className="text-[15px]">{quadrant.description}</p>\n        </section>\n      )}\n\n      <section aria-labelledby="scores"',
  ],
]);

edit('lib/exportPng.ts', [
  ["import { formatValue } from './engine';", "import { formatValue } from './engine';\nimport { drawRadar } from './exportRadar';"],
  ['  let h = pad + 44 + 40 + 32;', '  const radar = result.scales.length >= 3;\n  const radarH = radar ? 520 : 0;\n  let h = pad + 44 + 40 + 32 + radarH;'],
  ['  y += 56;\n\n  for (const { s, desc }', '  y += 56;\n\n  if (radar) {\n    drawRadar(ctx, W / 2, y + 250, 170, result.scales, font);\n    y += radarH;\n  }\n\n  for (const { s, desc }'],
]);

edit('app/layout.tsx', [
  [
    'export const metadata: Metadata = {',
    "export const metadata: Metadata = {\n  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://psychotests.vercel.app'),\n  openGraph: { type: 'website', locale: 'ru_RU', siteName: 'Психотесты' },",
  ],
]);
console.log('patched');
