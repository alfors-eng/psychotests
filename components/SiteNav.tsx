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

/** Плоская шапка с границей; ссылки видны от 1024 px, ниже — бургер и меню на весь экран. */
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

  const parts = path.split('/');
  const inRun = parts[1] === 'tests' && parts[3] === 'run';
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  // Во время теста навигация не нужна: только название сайта
  if (inRun) {
    return (
      <header className="px-gutter pt-5 print:hidden">
        <Link href="/" className="mx-auto flex max-w-2xl items-center gap-2 text-ui text-muted transition-colors hover:text-ink">
          <Logo />
          <span className="font-display">Психотесты NoNinaaao</span>
        </Link>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between gap-4 px-gutter">
          <Link href="/" className="flex items-center gap-2.5 py-1 text-lg">
            <Logo />
            <span className="font-display">Психотесты NoNinaaao</span>
          </Link>

          <nav aria-label="Основная навигация" className="hidden items-center gap-1 text-ui lg:flex">
            {LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={active(href) ? 'page' : undefined}
                className={`rounded-control px-3.5 py-2.5 transition-colors duration-200 hover:bg-accent-soft ${active(href) ? 'bg-accent-soft font-medium text-ink' : 'text-muted hover:text-ink'}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <MotionToggle />
            <ThemeToggle />
            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
              onClick={() => setOpen((v) => !v)}
              className="relative h-11 w-11 rounded-control hover:bg-accent-soft lg:hidden"
            >
              <span aria-hidden="true" className={`absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-ink transition-transform duration-300 ease-out ${open ? 'rotate-45' : '-translate-y-1.5'}`} />
              <span aria-hidden="true" className={`absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-ink transition-transform duration-300 ease-out ${open ? '-rotate-45' : 'translate-y-1.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Меню" className="fixed inset-0 z-50 flex flex-col bg-bg px-gutter pb-10 pt-24 lg:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-3 inline-flex h-11 w-11 items-center justify-center rounded-control hover:bg-accent-soft"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <ul>
            {LINKS.map(([href, label]) => (
              <li key={href}>
                <Link href={href} aria-current={active(href) ? 'page' : undefined} className="font-display block border-b border-line py-4 text-3xl aria-[current=page]:text-accent">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-auto max-w-sm text-ui text-muted">Тест не является диагнозом. Данные остаются в вашем браузере.</p>
        </div>
      )}
    </header>
  );
}
