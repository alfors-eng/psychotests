import Link from 'next/link';
import Catalog from '@/components/Catalog';
import HeroArt from '@/components/Hero';
import { getAllTests, isReady, toSummary } from '@/lib/tests';

const FEATURES = [
  { title: 'Без регистрации', text: 'Открываете тест и проходите сразу.', d: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z' },
  { title: 'Данные только у вас', text: 'Ответы считаются в браузере и никуда не уходят.', d: 'M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3' },
  { title: 'Открытые методики', text: 'Источник и лицензия указаны в каждой карточке.', d: 'M4 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4V5Zm16 0h-4a2 2 0 0 0-2 2' },
];

export default function HomePage() {
  const all = getAllTests();
  const tests = all.map(toSummary);
  const ready = all.filter(isReady).length;
  return (
    <div className="space-y-14">
      <section className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-ink">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
            {ready} тестов доступно
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Психологические тесты</h1>
          <p className="max-w-xl text-lg text-muted">
            Открытые методики с понятной интерпретацией. Выберите тему, пройдите тест за несколько минут и
            получите результат с пояснениями.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#popular" className="btn btn-primary">
              Выбрать тест
            </a>
            <Link href="/about" className="btn btn-ghost">
              О проекте
            </Link>
          </div>
        </div>
        <HeroArt className="mx-auto h-auto w-full max-w-sm md:max-w-none" />
      </section>

      <section aria-label="Принципы сайта">
        <ul className="grid gap-3 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="card flex items-start gap-3 p-4">
              <span className="cat-bubble inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d={f.d} />
                </svg>
              </span>
              <div>
                <p className="font-semibold">{f.title}</p>
                <p className="text-sm text-muted">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Catalog tests={tests} />
    </div>
  );
}
