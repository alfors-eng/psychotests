const fs = require('fs');
const rw = (p, f) => { const s = fs.readFileSync(p, 'utf8'); const t = f(s); if (s === t) console.log('NO CHANGE', p); fs.writeFileSync(p, t); };

rw('app/layout.tsx', (s) => {
  s = s.replace('className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-14"', 'className="mx-auto w-full max-w-[110rem] px-[clamp(1rem,4vw,4.5rem)] pb-24 pt-10 sm:pt-14"');
  s = s.replace('<footer className="px-3 pb-8 print:hidden">', '<footer className="px-[clamp(0.75rem,3vw,4rem)] pb-8 print:hidden">');
  s = s.replace('<div className="mx-auto grid max-w-6xl gap-8', '<div className="mx-auto grid max-w-[110rem] gap-8');
  return s;
});
rw('components/SiteNav.tsx', (s) => {
  s = s.replace('<header className="sticky top-3 z-40 px-3 pt-3 print:hidden">', '<header className="sticky top-3 z-40 px-[clamp(0.75rem,3vw,4rem)] pt-3 print:hidden">');
  s = s.replace('<div className="mx-auto flex max-w-6xl items-center', '<div className="mx-auto flex max-w-[110rem] items-center');
  return s;
});
rw('components/Catalog.tsx', (s) => s.replace(/grid gap-4 sm:grid-cols-2 lg:grid-cols-3"/g, 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"'));
rw('app/page.tsx', (s) => s.replace('lg:grid-cols-[1fr_30rem] lg:gap-6 xl:grid-cols-[1fr_34rem]', 'lg:grid-cols-[1fr_30rem] lg:gap-6 xl:grid-cols-[1fr_34rem] 2xl:grid-cols-[1fr_44rem]'));
rw('app/design.css', (s) => {
  s = s.replace('font-size: clamp(2.7rem, 8vw, 5.4rem);', 'font-size: clamp(2.7rem, 7.2vw, 8rem);');
  // свечение: на всю ширину окна, с плавным затуханием снизу, без жёстких краёв
  s = s.replace(/\.aura \{[\s\S]*?\n\}\nhtml\.dark \.aura \{[\s\S]*?\n\}\n/, `.aura {
  position: absolute;
  top: -10rem;
  left: 50%;
  width: 100vw;
  height: 54rem;
  transform: translateX(-50%);
  z-index: -10;
  pointer-events: none;
  background:
    radial-gradient(38rem 28rem at 78% 30%, rgb(176 162 232 / 0.34), transparent 70%),
    radial-gradient(34rem 26rem at 18% 22%, rgb(240 196 96 / 0.3), transparent 70%),
    radial-gradient(36rem 28rem at 52% 70%, rgb(240 164 200 / 0.26), transparent 70%);
  -webkit-mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
}
html.dark .aura {
  background:
    radial-gradient(38rem 28rem at 78% 30%, rgb(176 162 232 / 0.2), transparent 70%),
    radial-gradient(34rem 26rem at 18% 22%, rgb(240 196 96 / 0.14), transparent 70%),
    radial-gradient(36rem 28rem at 52% 70%, rgb(240 164 200 / 0.14), transparent 70%);
}
`);
  s = s.replace('@media (min-width: 1280px) { .fan { --w: 17rem; height: 31rem; } }', '@media (min-width: 1280px) { .fan { --w: 17rem; height: 31rem; } }\n@media (min-width: 1536px) { .fan { --w: 20rem; height: 36rem; } }');
  return s;
});
