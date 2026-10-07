// Одноразовый патч: анимация появления полос, кольца и смены вопроса.
const fs = require('fs');
const edit = (file, pairs) => {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(file + ' нет: ' + String(a).slice(0, 70));
    s = s.replace(a, b);
  }
  fs.writeFileSync(file, s);
};
edit('components/Charts.tsx', [
  ['<div className="h-full rounded-full bg-accent" style={{ width: `${s.percent}%` }} />', '<div className="anim-bar h-full rounded-full bg-accent" style={{ width: `${s.percent}%` }} />'],
  ['        className="stroke-accent"\n      />', '        className="anim-ring stroke-accent"\n      />'],
]);
edit('components/AnswerAnalytics.tsx', [
  ['<div className="h-full rounded-full bg-[rgb(var(--cat))]" style={{ width: `${(b.count / max) * 100}%`', '<div className="anim-bar h-full rounded-full bg-[rgb(var(--cat))]" style={{ width: `${(b.count / max) * 100}%`'],
]);
edit('components/Runner.tsx', [
  ['      <fieldset className="space-y-6">', '      <fieldset key={q.id} className="anim-question space-y-6">'],
]);
console.log('ok');
