import CategoryIcon from '@/components/CategoryIcon';
import { CATEGORIES } from '@/lib/categories';

const CHIPS = [
  { text: 'Экстраверсия · 72 %', cls: 'cat-personality', pos: 'left-[-2%] top-[14%]', d: '0s' },
  { text: 'Благополучие · 64 %', cls: 'cat-wellbeing', pos: 'right-[-3%] top-[38%]', d: '1.4s' },
  { text: 'Спокойствие · 58 %', cls: 'cat-eq', pos: 'left-[4%] bottom-[10%]', d: '2.6s' },
];

/** Иллюстрация главной: радар, который рисуется при загрузке, орбита категорий и плавающие «карточки результатов». Декоративная. */
export default function HeroArt({ className = '' }: { className?: string }) {
  const R = 96;
  const cx = 200;
  const cy = 200;
  const vals = [0.82, 0.55, 0.9, 0.46, 0.7, 0.64];
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / vals.length - Math.PI / 2;
    return [cx + R * v * Math.cos(a), cy + R * v * Math.sin(a)] as const;
  };
  const poly = (f: (i: number) => number) => vals.map((_, i) => pt(i, f(i)).map((n) => n.toFixed(1)).join(',')).join(' ');

  return (
    <div aria-hidden="true" className={`relative mx-auto aspect-square w-full max-w-md ${className}`}>
      <div className="anim-drift absolute left-[6%] top-[8%] h-[58%] w-[58%] rounded-full bg-[rgb(var(--accent)/0.20)]" />
      <div className="anim-drift absolute bottom-[4%] right-[4%] h-[46%] w-[46%] rounded-full bg-[rgb(var(--c-relationships)/0.16)]" style={{ ['--d' as string]: '-6s' }} />
      <div className="anim-drift absolute right-[18%] top-[2%] h-[26%] w-[26%] rounded-full bg-[rgb(var(--c-wellbeing)/0.22)]" style={{ ['--d' as string]: '-3s' }} />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" focusable="false">
        {[0.33, 0.66, 1].map((k) => (
          <polygon key={k} points={poly(() => k)} fill="none" stroke="rgb(var(--border))" strokeWidth="1.5" />
        ))}
        {vals.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgb(var(--border))" strokeWidth="1.5" />;
        })}
        <polygon points={poly((i) => vals[i])} fill="rgb(var(--accent) / 0.26)" stroke="rgb(var(--accent))" strokeWidth="3.5" strokeLinejoin="round" className="anim-draw" style={{ ['--len' as string]: 1000 }} />
        {vals.map((v, i) => {
          const [x, y] = pt(i, v);
          return <circle key={i} cx={x} cy={y} r="6" fill="rgb(var(--accent))" className="anim-pop" style={{ ['--d' as string]: `${1.2 + i * 0.12}s`, transformBox: 'fill-box', transformOrigin: 'center' }} />;
        })}
        <circle cx={cx} cy={cy} r="7" fill="rgb(var(--accent))" />
      </svg>

      <div className="anim-orbit absolute inset-0" style={{ ['--t' as string]: '80s' }}>
        {CATEGORIES.map((c, i) => {
          const a = (i * 2 * Math.PI) / CATEGORIES.length;
          return (
            <div key={c.id} className="absolute" style={{ left: `${50 + 43 * Math.sin(a)}%`, top: `${50 - 43 * Math.cos(a)}%` }}>
              <div className="anim-counter" style={{ ['--t' as string]: '80s' }}>
                <span className={`cat-${c.id} cat-bubble -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface shadow-sm sm:-ml-6 sm:-mt-6 sm:h-12 sm:w-12`}>
                  <CategoryIcon id={c.id} className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {CHIPS.map((c) => (
        <span
          key={c.text}
          className={`anim-float ${c.cls} absolute ${c.pos} hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium shadow-sm sm:inline-flex`}
          style={{ ['--d' as string]: c.d }}
        >
          <span className="inline-block h-2 w-2 rounded-full bg-[rgb(var(--cat))]" />
          {c.text}
        </span>
      ))}
    </div>
  );
}
