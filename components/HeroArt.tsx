import CategoryIcon from '@/components/CategoryIcon';
import Logo from '@/components/Logo';
import { CATEGORIES } from '@/lib/categories';

/** Две кольцевые орбиты категорий вокруг центра. Чисто декоративно: смысл несёт каталог ниже. */
const OUTER = CATEGORIES.slice(0, 5);
const INNER = CATEGORIES.slice(5);

function Ring({ items, size, speed, offset }: { items: typeof CATEGORIES; size: string; speed: string; offset: number }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full border border-dashed border-line-strong" />
      <div className="orbit absolute inset-0" style={{ ['--orbit' as string]: speed }}>
        {items.map((c, i) => {
          const a = ((offset + (360 / items.length) * i) * Math.PI) / 180;
          return (
            <div key={c.id} className="absolute" style={{ left: `${50 + 50 * Math.cos(a)}%`, top: `${50 + 50 * Math.sin(a)}%` }}>
              <div className="-translate-x-1/2 -translate-y-1/2">
                <div className="orbit-rev" style={{ ['--orbit' as string]: speed }}>
                  <span
                    className={`cat-${c.id} inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgb(var(--cat)/0.35)] bg-surface shadow-float sm:h-14 sm:w-14`}
                    style={{ color: 'rgb(var(--cat))' }}
                  >
                    <CategoryIcon id={c.id} className="h-6 w-6 sm:h-7 sm:w-7" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HeroArt() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[34rem] select-none">
      <div className="dot-grid absolute inset-0" />
      <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.28),transparent_70%)]" />
      <Ring items={OUTER} size="84%" speed="120s" offset={-90} />
      <Ring items={INNER} size="52%" speed="80s" offset={-30} />
      <div className="bob absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface shadow-float sm:h-28 sm:w-28">
        <Logo className="h-14 w-14 sm:h-16 sm:w-16" />
      </div>
    </div>
  );
}
