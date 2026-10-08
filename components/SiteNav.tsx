'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';
import MotionToggle from '@/components/MotionToggle';
import ThemeToggle from '@/components/ThemeToggle';

const LINKS: [string, string][] = [
  ['/', 'Тесты'],
  ['/profile', 'Профиль'],
  ['/results', 'Мои результаты'],
  ['/about', 'О проекте'],
];

/** Плавающая «стеклянная» навигация-капсула; на узких экранах — меню на весь экран. */
export default function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <header className="sticky top-3 z-40 px-3 pt-3 print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full border border-line bg-surface/90 py-1.5 pl-4 pr-1.5 shadow-[0_18px_40px_-26px_rgb(var(--tint)/0.6)] backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 py-1 text-[17px] font-semibold tracking-tight">
          <Logo />
          <span className="font-display">Психотесты NoNinaaao</span>
        </Link>

        <nav aria-label="Основная навигация" className="hidden items-center gap-1 text-[15px] md:flex">
          {LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? 'page' : undefined}
              className={`rounded-full px-4 py-2 transition-colors duration-300 hover:bg-accent-soft ${active(href) ? 'bg-accent-soft font-medium' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          <MotionToggle />
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setOpen((v) => !v)}
            className="relative ml-1 h-11 w-11 rounded-full bg-accent-soft md:hidden"
          >
            <span aria-hidden="true" className={`absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'rotate-45' : '-translate-y-1.5'}`} />
            <span aria-hidden="true" className={`absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? '-rotate-45' : 'translate-y-1.5'}`} />
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Меню" className="veil-in fixed inset-0 z-50 flex flex-col bg-bg/95 px-6 pb-10 pt-24 backdrop-blur-2xl md:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-xl"
          >
            <span aria-hidden="true">×</span>
          </button>
          <ul className="space-y-2">
            {LINKS.map(([href, label], i) => (
              <li key={href} className="menu-in" style={{ ['--d' as string]: `${0.08 + i * 0.07}s` }}>
                <Link href={href} aria-current={active(href) ? 'page' : undefined} className="font-display block border-b border-line py-4 text-4xl tracking-tight">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="menu-in mt-auto text-sm text-muted" style={{ ['--d' as string]: '0.4s' }}>
            Тест не является диагнозом. Данные остаются в вашем браузере.
          </p>
        </div>
      )}
    </header>
  );
}
