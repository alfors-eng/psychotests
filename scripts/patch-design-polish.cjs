const fs = require('fs');
let c = fs.readFileSync('components/Catalog.tsx', 'utf8');
c = c.split('className="mb-4 flex items-center gap-2 text-xl font-semibold"').join('className="mb-6 flex items-center gap-2 text-3xl font-medium"');
c = c.split('className="flex items-center gap-2 text-xl font-semibold"').join('className="flex items-center gap-2 text-3xl font-medium"');
fs.writeFileSync('components/Catalog.tsx', c);
let r = fs.readFileSync('components/Runner.tsx', 'utf8');
r = r.replace('className="flex items-start gap-4 text-2xl font-semibold leading-snug" id="qtext"', 'className="font-display flex items-start gap-4 text-2xl font-medium leading-snug sm:text-3xl" id="qtext"');
fs.writeFileSync('components/Runner.tsx', r);
console.log('ok');
