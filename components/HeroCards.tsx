import Link from 'next/link';
import type { CategoryId } from '@/lib/types';

export type FanItem = {
  id: string;
  cat: CategoryId;
  title: string;
  hint: string;
  minutes: number;
  questions: number;
  art: 'ring' | 'radar' | 'pair';
  x: string;
  y: string;
  r: string;
  d: string;
};

/** Небольшие иллюстрации-подсказки: что получится на выходе теста. Декоративные. */
function Art({ kind }: { kind: FanItem['art'] }) {
  const common = { viewBox: '0 0 120 120', className: 'h-28 w-28', fill: 'none', stroke: 'currentColor', 'aria-hidden': true, focusable: false } as const;
  if (kind === 'ring') {
    return (
      <svg {...common} strokeLinecap="round">
        <circle cx="60" cy="60" r="42" strokeWidth="10" opacity="0.16" />
        <circle cx="60" cy="60" r="42" strokeWidth="10" strokeDasharray="190 264" transform="rotate(-90 60 60)" className="anim-ring" />
        <circle cx="60" cy="60" r="4" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === 'radar') {
    const pts = [0.9, 0.55, 0.8, 0.45, 0.7].map((v, i) => {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      return `${(60 + 46 * v * Math.cos(a)).toFixed(1)},${(60 + 46 * v * Math.sin(a)).toFixed(1)}`;
    });
    const ring = (k: number) =>
      [0, 1, 2, 3, 4]
        .map((i) => {
          const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return `${(60 + 46 * k * Math.cos(a)).toFixed(1)},${(60 + 46 * k * Math.sin(a)).toFixed(1)}`;
        })
        .join(' ');
    return (
      <svg {...common} strokeLinejoin="round">
        <polygon points={ring(1)} strokeWidth="1.5" opacity="0.35" />
        <polygon points={ring(0.55)} strokeWidth="1.5" opacity="0.25" />
        <polygon points={pts.join(' ')} strokeWidth="3" fill="currentColor" fillOpacity="0.18" className="anim-draw" style={{ ['--len' as string]: 300 }} />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="44" cy="60" r="30" strokeWidth="3" />
      <circle cx="76" cy="60" r="30" strokeWidth="3" />
      <path d="M60 36a30 30 0 0 1 0 48a30 30 0 0 1 0-48Z" fill="currentColor" fillOpacity="0.2" stroke="none" />
    </svg>
  );
}

/** «Веер» из карточек тестов в первом экране. Сами карточки — ссылки на тесты. */
export default function HeroCards({ items }: { items: FanItem[] }) {
  return (
    <div className="fan">
      {items.map((it) => (
        <Link
          key={it.id}
          href={`/tests/${it.id}`}
          className={`fan-card tile cat-${it.cat} flex flex-col justify-between p-6`}
          style={{ ['--x' as string]: it.x, ['--y' as string]: it.y, ['--r' as string]: it.r, ['--d' as string]: it.d }}
        >
          <span className="tile-chip inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium">
            ≈ {it.minutes} мин · {it.questions} вопр.
          </span>
          <span className="flex justify-center">
            <Art kind={it.art} />
          </span>
          <span className="flex items-end justify-between gap-3">
            <span className="space-y-1">
              <span className="font-display block text-[1.7rem] leading-[1.05]">{it.title}</span>
              <span className="tile-muted block text-sm leading-snug">{it.hint}</span>
            </span>
            <span aria-hidden="true" className="tile-go inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
              </svg>
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
