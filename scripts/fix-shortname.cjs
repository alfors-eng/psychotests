// Одноразовый патч: восстановить регулярные выражения в shortName (при записи потерялись обратные слеши).
const fs = require('fs');
let p = fs.readFileSync('lib/profile.ts', 'utf8').split('\n');
const set = (prefix, line) => {
  const i = p.findIndex((l) => l.trimStart().startsWith(prefix));
  if (i < 0) throw new Error('нет строки: ' + prefix);
  p[i] = line;
};
set('const lead =', "  const lead = title.match(/^([A-Za-z][A-Za-z0-9-]*)\\s+[—–-]\\s/);");
set('const parens =', "  const parens = [...title.matchAll(/\\(([^)]+)\\)/g)].map((m) => m[1].split(',')[0].trim()).filter((x) => /[A-Za-z0-9]/.test(x));");
set('const code =', "  const code = title.match(/\\b[A-Z][A-Za-z]*-?[A-Z0-9][A-Za-z0-9-]*\\b/);");
set('const words =', "  const words = title.split(/\\s+/);");
fs.writeFileSync('lib/profile.ts', p.join('\n'));
console.log('ok');
