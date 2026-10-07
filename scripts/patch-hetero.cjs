// Одноразовый патч: практическая значимость расхождения (τ ≥ 10 п. п.) и сокращённый список.
const fs = require('fs');
const edit = (file, pairs) => {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(file + ' нет: ' + String(a).slice(0, 70));
    s = s.replace(a, b);
  }
  fs.writeFileSync(file, s);
};
edit('lib/deepInsights.ts', [[
  "  const hetero = r.dims.filter((d) => d.i2 !== null && d.i2 >= 50 && d.tests >= 2);\n  if (hetero.length) {",
  "  // Расхождение считаем значимым, если оно велико и статистически (I² ≥ 50 %), и практически (τ ≥ 10 п. п.).\n  const hetero = r.dims\n    .filter((d) => d.i2 !== null && d.i2 >= 50 && d.tests >= 2 && Math.sqrt(d.tau2) >= 10)\n    .sort((a, b) => b.i2! - a.i2!);\n  if (hetero.length) {",
], [
  "${hetero.map((d) => `${title(d.def.id)} (I² ${Math.round(d.i2!)} %)`).join('; ')}.",
  "${hetero.slice(0, 5).map((d) => `${title(d.def.id)} (I² ${Math.round(d.i2!)} %)`).join('; ')}${hetero.length > 5 ? ` и ещё ${hetero.length - 5}` : ''}.",
]]);
edit('components/DeepView.tsx', [[
  "<li className={`rounded-full border px-2 py-0.5 ${d.i2 >= 50 ? 'border-warm text-warm' : 'border-line'}`}>",
  "<li className={`rounded-full border px-2 py-0.5 ${d.i2 >= 50 && Math.sqrt(d.tau2) >= 10 ? 'border-warm text-warm' : 'border-line'}`}>",
]]);
console.log('ok');
