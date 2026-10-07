import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://psychotests.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Психотесты',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Психотесты' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
  title: { default: 'Психотесты — каталог тестов онлайн', template: '%s · Психотесты' },
  description:
    'Каталог психологических тестов с открытыми методиками. Без регистрации: результаты считаются в вашем браузере и никуда не отправляются.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f4' },
    { media: '(prefers-color-scheme: dark)', color: '#14181c' },
  ],
};

// Выставляем тему до отрисовки, чтобы не было вспышки.
const themeScript = `(function(){try{var t=localStorage.getItem('pt:theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <div aria-hidden="true" className="bg-decor pointer-events-none fixed inset-0 -z-10 print:hidden" />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
        >
          К содержимому
        </a>
        <header className="border-b border-line bg-bg/70 backdrop-blur print:hidden">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              <span className="inline-flex items-center gap-2">
                <Logo />
                Психотесты
              </span>
            </Link>
            <nav aria-label="Основная навигация" className="flex items-center gap-1 text-[15px]">
              {[
                ['/', 'Тесты'],
                ['/profile', 'Профиль'],
                ['/results', 'Мои результаты'],
                ['/about', 'О проекте'],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="rounded-full px-3 py-2 hover:bg-accent-soft">
                  {label}
                </Link>
              ))}
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
          {children}
        </main>
        <footer className="border-t border-line print:hidden">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
            Тесты не являются диагнозом. Для оценки состояния обратитесь к специалисту. Ответы и результаты
            хранятся только в вашем браузере; трекеров и аналитики на сайте нет.{' '}
            <Link href="/contribute" className="underline underline-offset-4">
              Для специалистов
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
