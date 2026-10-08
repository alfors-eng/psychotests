const fs = require('fs');
let s = fs.readFileSync('app/design.css', 'utf8');
const cut = (re, rep = '') => { const t = s.replace(re, rep); if (t === s) console.log('NO MATCH', re); s = t; };
// зерно
cut(/\/\* Зерно[\s\S]*?@media print \{ body::after \{ display: none; \} \}\n\n/);
// карточка: тонкая рамка и короткая тень, без лотка
cut(/\.card \{[\s\S]*?\n\}\nhtml\.dark \.card[^\n]*\n/, `.card {
  border-radius: 1.5rem;
  border: 1px solid rgb(var(--border));
  background: rgb(var(--surface));
  box-shadow: 0 1px 2px rgb(var(--tint) / 0.06), 0 10px 18px -14px rgb(var(--tint) / 0.28);
  transition: transform 0.6s var(--ease), box-shadow 0.6s var(--ease), border-color 0.4s var(--ease);
}
`);
cut(/\.eyebrow \{[\s\S]*?\n\}\n\.shell \{[\s\S]*?html\.dark \.shell > \.core[^\n]*\n\.mesh \{[\s\S]*?\n\}\n/, '');
cut('html { scroll-behavior: smooth; }', `html {
  scroll-behavior: smooth;
  accent-color: rgb(var(--accent));
  caret-color: rgb(var(--accent));
  scrollbar-color: rgb(var(--border)) transparent;
}`);
s += `
/* Кнопка к якорю на той же странице — стрелка вниз, а не «открыть в новой вкладке» */
.btn-primary[href^='#']::after {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23fffdfa' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M8 3.5v9M4.5 9l3.5 3.5L11.5 9'/></svg>");
}
html.dark .btn-primary[href^='#']::after {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%230e1412' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M8 3.5v9M4.5 9l3.5 3.5L11.5 9'/></svg>");
}
`;
fs.writeFileSync('app/design.css', s);
