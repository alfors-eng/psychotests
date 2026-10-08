const fs = require('fs');
const p = 'app/tests/[id]/page.tsx';
let s = fs.readFileSync(p, 'utf8');
const note = s.match(/      \{t\.isClinical && !ref && \([\s\S]*?\n      \)\}\n\n/)[0];
s = s.replace(note, '');
s = s.replace('      {ready && t.mode === \'external\' ? (', note + '      {ready && t.mode === \'external\' ? (');
s = s.replace(/        <span aria-hidden="true" className="absolute -right-10[^\n]*\n        <span aria-hidden="true" className="absolute -bottom-12[^\n]*\n/, '');
s = s.replace(' sm:grid-cols-4 dots">', ' sm:grid-cols-4">');
fs.writeFileSync(p, s);
