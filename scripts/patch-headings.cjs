// Приводит заголовки h1/h2 к шкале .t-h1 / .t-h2 / .t-h3 (см. app/globals.css). Запуск: node scripts/patch-headings.cjs
const fs = require('fs');
const path = require('path');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = [...walk('app'), ...walk('components')].filter((f) => f.endsWith('.tsx'));
const map = [
  [/(<h1[^>]*className=")text-3xl font-semibold tracking-tight(")/g, '$1t-h1$2'],
  [/(<h1[^>]*className=")text-3xl font-medium sm:text-5xl(")/g, '$1t-h1$2'],
  [/(<h1[^>]*className=")text-2xl font-semibold tracking-tight sm:text-3xl(")/g, '$1t-h1$2'],
  [/(<h1[^>]*className=")text-2xl font-semibold(")/g, '$1t-h1$2'],
  [/(<h2[^>]*className=")text-xl font-semibold(")/g, '$1t-h3 font-display$2'],
  [/(<h2[^>]*className=")text-lg font-semibold(")/g, '$1t-h3 font-display$2'],
  [/(<h2[^>]*className=")text-2xl font-medium(")/g, '$1t-h2$2'],
];
let n = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  let t = s;
  for (const [re, to] of map) t = t.replace(re, to);
  if (t !== s) { fs.writeFileSync(f, t); n++; }
}
console.log('изменено файлов:', n);
