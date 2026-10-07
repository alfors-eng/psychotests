// Одноразовый патч: пункты-«филлеры» (LOT-R) показываются, но не входят в подсчёт.
const fs = require('fs');
const edit = (file, pairs) => {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error('не найдено в ' + file + ': ' + a.slice(0, 50));
    s = s.replace(a, b);
  }
  fs.writeFileSync(file, s);
};
edit('lib/types.ts', [[
  '  scoreWhen?: number[];',
  '  scoreWhen?: number[];\n  /** Пункт показывается, но в подсчёт не входит (например, «отвлекающие» пункты LOT-R). */\n  filler?: boolean;',
]]);
edit('lib/engine.ts', [
  ["? [{ id: 'total', title: test.scoring.totalTitle ?? 'Общий балл', qs: test.questions }]", "? [{ id: 'total', title: test.scoring.totalTitle ?? 'Общий балл', qs: test.questions.filter((q) => !q.filler) }]"],
]);
edit('lib/validate.ts', [
  ['    for (const q of t.questions)\n      if (!q.subscale ||', '    for (const q of t.questions.filter((x) => !x.filler))\n      if (!q.subscale ||'],
]);
console.log('ok');
