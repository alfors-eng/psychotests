// Одноразовый патч: правило помощи может быть списком и срабатывать при низких баллах (max).
const fs = require('fs');
const edit = (file, pairs) => {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(`не найдено в ${file}: ${a.slice(0, 50)}`);
    s = s.replace(a, b);
  }
  fs.writeFileSync(file, s);
};

edit('lib/types.ts', [
  [
    '  /** Показать мягкий блок помощи при значении шкалы >= min. */\n  helpAboveScore?: { scale: string; min: number };',
    '  /**\n   * Показать мягкий блок помощи, если значение шкалы >= min (высокие баллы) или <= max (низкие,\n   * например WHO-5). Можно задать список правил по разным шкалам; достаточно сработать одному.\n   */\n  helpAboveScore?: HelpRule | HelpRule[];',
  ],
]);
fs.appendFileSync(
  'lib/types.ts',
  `
export interface HelpRule {
  scale: string;
  min?: number;
  max?: number;
}
`,
);

edit('lib/engine.ts', [
  [
    "  const scale = s.helpAboveScore ? result.scales.find((x) => x.id === s.helpAboveScore!.scale) : undefined;\n  const high = !!(s.helpAboveScore && scale && scale.value >= s.helpAboveScore.min);",
    "  const rules = s.helpAboveScore ? [s.helpAboveScore].flat() : [];\n  const high = rules.some((r) => {\n    const sc = result.scales.find((x) => x.id === r.scale);\n    if (!sc) return false;\n    return (r.min !== undefined && sc.value >= r.min) || (r.max !== undefined && sc.value <= r.max);\n  });",
  ],
]);

edit('lib/validate.ts', [
  [
    "    if (t.safety.helpAboveScore && !scaleIds.includes(t.safety.helpAboveScore.scale)) e('safety: неизвестная шкала');",
    "    for (const r of t.safety.helpAboveScore ? [t.safety.helpAboveScore].flat() : []) {\n      if (!scaleIds.includes(r.scale)) e(`safety: неизвестная шкала «${r.scale}»`);\n      if (r.min === undefined && r.max === undefined) e('safety: у правила нужен min или max');\n    }",
  ],
]);
console.log('patched');
