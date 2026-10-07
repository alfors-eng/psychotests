// Одноразовый патч: краткие названия тестов (для подписей на диаграммах и чипов в таблицах).
const fs = require('fs');
const edit = (file, pairs) => {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(file + ' нет: ' + String(a).slice(0, 60));
    s = s.replace(a, b);
  }
  fs.writeFileSync(file, s);
};
edit('lib/types.ts', [['  popular?: boolean;', '  popular?: boolean;\n  /** Краткое имя для подписей (если автоматическое получается неудачным). */\n  shortName?: string;']]);
let p = fs.readFileSync('lib/profile.ts', 'utf8');
const start = p.indexOf('/** Краткое имя теста');
const end = p.indexOf('/** Берёт самое свежее');
p = p.slice(0, start) + `/**
 * Краткое имя теста: код перед тире («PHQ-9 — …»), латинская аббревиатура в скобках («… (DASS-21)»),
 * код в названии («… PCL-5») или последнее слово. Для редких случаев в JSON есть поле shortName.
 */
export function shortName(title: string): string {
  const lead = title.match(/^([A-Za-z][A-Za-z0-9-]*)\s+[—–-]\s/);
  if (lead) return lead[1];
  const parens = [...title.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].split(',')[0].trim()).filter((x) => /[A-Za-z0-9]/.test(x));
  if (parens.length) return parens[parens.length - 1];
  const code = title.match(/\b[A-Z][A-Za-z]*-?[A-Z0-9][A-Za-z0-9-]*\b/);
  if (code) return code[0];
  const words = title.split(/\s+/);
  return words[words.length - 1];
}

` + p.slice(end);
p = p.replace('short: shortName(t.title),', 'short: t.shortName ?? shortName(t.title),');
fs.writeFileSync('lib/profile.ts', p);

const set = (id, patch) => {
  const f = `data/tests/${id}.json`;
  const t = JSON.parse(fs.readFileSync(f, 'utf8'));
  Object.assign(t, patch);
  fs.writeFileSync(f, JSON.stringify(t, null, 2) + '\n');
};
set('rosenberg-self-esteem', { shortName: 'Розенберг' });
// латинская K в названии K6 (раньше была кириллическая К)
const k6 = JSON.parse(fs.readFileSync('data/tests/k6.json', 'utf8'));
k6.title = k6.title.replace('К6', 'K6');
fs.writeFileSync('data/tests/k6.json', JSON.stringify(k6, null, 2) + '\n');
console.log('ok');
