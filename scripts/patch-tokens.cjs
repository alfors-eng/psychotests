// Переводит классы размеров, радиусов и теней на токены «Тихой клиники». Запуск: node scripts/patch-tokens.cjs
const fs = require('fs');
const path = require('path');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = [...walk('app'), ...walk('components')].filter((f) => f.endsWith('.tsx'));
const rules = [
  [/text-\[15px\]/g, 'text-ui'],
  [/text-\[13px\]/g, 'text-meta'],
  [/text-\[(12|11|10)px\]/g, 'text-xs'],
  [/rounded-xl2\b/g, 'rounded-card'],
  [/rounded-2xl\b/g, 'rounded-card'],
  [/rounded-\[(2|1\.75|2\.25)rem\]/g, 'rounded-card'],
  [/rounded-xl\b/g, 'rounded-control'],
  [/rounded-lg\b/g, 'rounded-control'],
  [/rounded-md\b/g, 'rounded-control'],
  [/\bshadow-(lg|md)\b/g, 'shadow-float'],
  [/ shadow-sm\b/g, ''],
];
let n = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  let t = s;
  for (const [re, to] of rules) t = t.replace(re, to);
  if (t !== s) { fs.writeFileSync(f, t); n++; }
}
console.log('изменено файлов:', n);
