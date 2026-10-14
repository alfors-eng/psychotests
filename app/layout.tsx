import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Literata, Onest } from 'next/font/google';
import './tokens.css';
import './globals.css';
import DataGuard from '@/components/DataGuard';
import SiteNav from '@/components/SiteNav';

// Шрифты скачиваются при сборке и отдаются с вашего домена: запросов к Google во время работы сайта нет.
const sans = Onest({ subsets: ['latin', 'cyrillic'], variable: '--font-sans', display: 'swap' });
// Literata: спокойная книжная антиква с кириллицей для заголовков; Onest: интерфейс и текст.
const serif = Literata({ subsets: ['latin', 'cyrillic'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://psychotests.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Психотесты NoNinaaao',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Психотесты NoNinaaao' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
  appleWebApp: { capable: true, title: 'Психотесты', statusBarStyle: 'default' },
  title: { default: 'Психотесты NoNinaaao — каталог тестов онлайн', template: '%s · Психотесты NoNinaaao' },
  description:
    'Каталог психологических тестов с открытыми методиками. Без регистрации: результаты считаются в вашем браузере и никуда не отправляются.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f5f1' },
    { media: '(prefers-color-scheme: dark)', color: '#121413' },
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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
        >
          К содержимому
        </a>
        <SiteNav />
        <DataGuard />
        <main id="main" className="mx-auto w-full max-w-[100rem] px-gutter pb-24 pt-8 sm:pt-12">
          {children}
        </main>
        <footer className="mt-8 border-t border-line print:hidden">
          <div className="mx-auto grid max-w-[100rem] gap-8 px-gutter py-12 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3">
              <p className="font-display text-xl">Психотесты NoNinaaao</p>
              <p className="max-w-md text-ui text-muted">
                Тесты не являются диагнозом. Для оценки состояния обратитесь к специалисту. Ответы и результаты
                хранятся только в вашем браузере; трекеров и аналитики на сайте нет.
              </p>
            </div>
            <nav aria-label="Дополнительные ссылки" className="flex flex-wrap content-start gap-x-6 text-ui md:justify-end">
            <Link href="/about" className="inline-flex min-h-[44px] items-center text-muted underline-offset-4 hover:text-ink hover:underline">О проекте</Link>
            <Link href="/results" className="inline-flex min-h-[44px] items-center text-muted underline-offset-4 hover:text-ink hover:underline">Мои результаты</Link>
            <Link href="/profile" className="inline-flex min-h-[44px] items-center text-muted underline-offset-4 hover:text-ink hover:underline">Профиль</Link>
            <Link href="/data" className="inline-flex min-h-[44px] items-center text-muted underline-offset-4 hover:text-ink hover:underline">Мои данные</Link>
            <Link href="/privacy" className="inline-flex min-h-[44px] items-center text-muted underline-offset-4 hover:text-ink hover:underline">Конфиденциальность</Link>
            <Link href="/contribute" className="inline-flex min-h-[44px] items-center text-muted underline-offset-4 hover:text-ink hover:underline">Для специалистов</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
