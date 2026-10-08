// Одноразовый патч layout: шрифты, новая навигация, футер.
const fs = require('fs');
let s = fs.readFileSync('app/layout.tsx', 'utf8');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 60)); s = s.replace(a, b); };
rep("import './globals.css';\nimport Logo from '@/components/Logo';\nimport MotionToggle from '@/components/MotionToggle';\nimport ThemeToggle from '@/components/ThemeToggle';",
"import { Onest, Playfair_Display } from 'next/font/google';\nimport './globals.css';\nimport './design.css';\nimport SiteNav from '@/components/SiteNav';\n\n// Шрифты скачиваются при сборке и отдаются с вашего домена: запросов к Google во время работы сайта нет.\nconst sans = Onest({ subsets: ['latin', 'cyrillic'], variable: '--font-sans', display: 'swap' });\nconst serif = Playfair_Display({ subsets: ['latin', 'cyrillic'], variable: '--font-serif', display: 'swap' });");
rep('<html lang="ru" suppressHydrationWarning>', '<html lang="ru" suppressHydrationWarning className={`${sans.variable} ${serif.variable}`}>');
const a = s.indexOf('        <header className=');
const b = s.indexOf('        <main id="main"');
s = s.slice(0, a) + '        <SiteNav />\n' + s.slice(b);
rep('<main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:py-12">', '<main id="main" className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-14">');
const f1 = s.indexOf('        <footer');
const f2 = s.indexOf('        </footer>') + '        </footer>'.length;
s = s.slice(0, f1) + `        <footer className="px-3 pb-8 print:hidden">
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
        </footer>` + s.slice(f2);
s = s.replace("{ media: '(prefers-color-scheme: light)', color: '#faf8f4' }", "{ media: '(prefers-color-scheme: light)', color: '#f7f3ec' }").replace("color: '#14181c'", "color: '#131514'");
fs.writeFileSync('app/layout.tsx', s);
let t = fs.readFileSync('tailwind.config.ts', 'utf8');
t = t.replace("sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],", "sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],\n        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],");
fs.writeFileSync('tailwind.config.ts', t);
console.log('ok');
