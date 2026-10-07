const fs = require('fs');
let s = fs.readFileSync('components/CountUp.tsx', 'utf8');
const a = `    <span ref={ref} className="tabular-nums" aria-label={String(value)}>
      <span aria-hidden="true">{shown}</span>
    </span>`;
if (!s.includes(a)) throw new Error('нет');
s = s.replace(a, `    <span ref={ref} className="tabular-nums">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">{shown}</span>
    </span>`);
fs.writeFileSync('components/CountUp.tsx', s);
console.log('ok');
