import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Onest, Playfair_Display } from 'next/font/google';
import './globals.css';
import './design.css';
import SiteNav from '@/components/SiteNav';

// Шрифты скачиваются при сборке и отдаются с вашего домена: запросов к Google во время работы сайта нет.
const sans = Onest({ subsets: ['latin', 'cyrillic'], variable: '--font-sans', display: 'swap' });
const serif = Playfair_Display({ subsets: ['latin', 'cyrillic'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://psychotests.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Психотесты NoNinaaao',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Психотесты NoNinaaao' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
  title: { default: 'Психотесты NoNinaaao — каталог тестов онлайн', template: '%s · Психотесты NoNinaaao' },
  description:
    'Каталог психологических тестов с открытыми методиками. Без регистрации: результаты считаются в вашем браузере и никуда не отправляются.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f3ec' },
    { media: '(prefers-color-scheme: dark)', color: '#131514' },
  ],
};

// Выставляем тему до отрисовки, чтобы не было вспышки.
const themeScript = `(function(){try{var t=localStorage.getItem('pt:theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');if(localStorage.getItem('pt:motion')==='off')document.documentElement.classList.add('no-anim')}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${sans.variable} ${serif.variable}`}>
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
        <SiteNav />
        <main id="main" className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-14">
          {children}
        </main>
        <footer className="px-3 pb-8 print:hidden">
          <div className="mx-auto grid max-w-6xl gap-8 rounded-[2rem] border border-line bg-surface p-8 sm:p-10 md:grid-cols-[1.5fr_1fr]">
            <div className="space-y-3">
              <p className="font-display text-2xl">Психотесты NoNinaaao</p>
              <p className="max-w-md text-sm text-muted">
                Тесты не являются диагнозом. Для оценки состояния обратитесь к специалисту. Ответы и результаты
                хранятся только в вашем браузере; трекеров и аналитики на сайте нет.
              </p>
            </div>
            <nav aria-label="Дополнительные ссылки" className="flex flex-wrap content-start gap-x-6 gap-y-2 text-sm md:justify-end">
              <Link href="/about" className="underline-offset-4 hover:underline">О проекте</Link>
              <Link href="/results" className="underline-offset-4 hover:underline">Мои результаты</Link>
              <Link href="/profile" className="underline-offset-4 hover:underline">Профиль</Link>
              <Link href="/contribute" className="underline-offset-4 hover:underline">Для специалистов</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
