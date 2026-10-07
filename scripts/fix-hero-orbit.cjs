const fs = require('fs');
let s = fs.readFileSync('components/Hero.tsx', 'utf8');
const start = s.indexOf('        {CATEGORIES.map((c, i) => {');
const end = s.indexOf('      </div>\n\n      {CHIPS.map');
if (start < 0 || end < 0) throw new Error('блок не найден');
const block = `        {CATEGORIES.map((c, i) => {
          const a = (i * 2 * Math.PI) / CATEGORIES.length;
          return (
            <div key={c.id} className="absolute" style={{ left: \`\${50 + 43 * Math.sin(a)}%\`, top: \`\${50 - 43 * Math.cos(a)}%\` }}>
              <div className="anim-counter" style={{ ['--t' as string]: '80s' }}>
                <span className={\`cat-\${c.id} cat-bubble -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface shadow-sm sm:-ml-6 sm:-mt-6 sm:h-12 sm:w-12\`}>
                  <CategoryIcon id={c.id} className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
              </div>
            </div>
          );
        })}
`;
s = s.slice(0, start) + block + s.slice(end);
s = s.replace("  const orbit = 172; // радиус орбиты в пикселях при ширине 400\n", '');
fs.writeFileSync('components/Hero.tsx', s);
console.log('ok');
