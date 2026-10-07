import Link from 'next/link';
import Catalog from '@/components/Catalog';
import CategoryIcon from '@/components/CategoryIcon';
import CountUp from '@/components/CountUp';
import HeroArt from '@/components/Hero';
import Reveal from '@/components/Reveal';
import RoseChart, { type RoseDatum } from '@/components/RoseChart';
import { CATEGORIES } from '@/lib/categories';
import { getAllTests, isReady, toSummary } from '@/lib/tests';
import type { CategoryId } from '@/lib/types';

const INTENTS: { id: string; cat: CategoryId; title: string; text: string }[] = [
  { id: 'ipip-big5-50', cat: 'personality', title: 'Понять свой характер', text: 'Пять главных черт личности' },
  { id: 'dass-21', cat: 'emotional', title: 'Стресс и тревога', text: 'Как вы справляетесь с напряжением' },
  { id: 'who-5', cat: 'wellbeing', title: 'Самочувствие', text: 'Короткая проверка за минуту' },
  { id: 'rosenberg-self-esteem', cat: 'wellbeing', title: 'Самооценка', text: 'Как вы относитесь к себе' },
  { id: 'ecr-r', cat: 'relationships', title: 'Близкие отношения', text: 'Стиль привязанности' },
  { id: 'riasec', cat: 'career', title: 'Выбрать профессию', text: 'Профессиональные интересы' },
  { id: 'brief-cope', cat: 'emotional', title: 'Как я справляюсь', text: 'Стратегии совладания со стрессом' },
  { id: 'scs-sf', cat: 'wellbeing', title: 'Доброта к себе', text: 'Самосострадание и самокритика' },
];

const STEPS = [
  { n: 1, title: 'Выберите тест', text: 'По теме или через поиск. Время и число вопросов указаны в карточке.' },
  { n: 2, title: 'Ответьте на вопросы', text: 'Один вопрос на экран, цифры на клавиатуре, прогресс сохраняется.' },
  { n: 3, title: 'Получите разбор', text: 'Баллы, графики, объяснение и аналитика ваших ответов — прямо в браузере.' },
];

const FEATURES = [
  { title: 'Без регистрации', text: 'Открываете тест и проходите сразу.', d: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z' },
  { title: 'Данные только у вас', text: 'Ответы считаются в браузере и никуда не уходят.', d: 'M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3' },
  { title: 'Открытые методики', text: 'Источник и лицензия указаны в каждой карточке.', d: 'M4 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4V5Zm16 0h-4a2 2 0 0 0-2 2' },
];

/** Демонстрационные данные для витрины профиля (детерминированные). */
const DEMO: RoseDatum[] = CATEGORIES.flatMap((c, ci) =>
  Array.from({ length: 3 }, (_, i) => ({
    label: c.title,
    percent: 28 + ((ci * 37 + i * 23 + 11) % 62),
    category: c.id,
    value: 0,
    max: 100,
    source: 'пример',
  })),
);

export default function HomePage() {
  const all = getAllTests();
  const tests = all.map(toSummary);
  const readyTests = all.filter(isReady);
  const questions = readyTests.reduce((a, t) => a + t.questionCount, 0);
  const refs = all.length - readyTests.length;

  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          <p className="anim-fade-up inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-ink">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="anim-pulse absolute inset-0 rounded-full" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
            <CountUp value={readyTests.length} /> тестов доступно
          </p>
          <h1 className="anim-fade-up text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl" style={{ ['--d' as string]: '0.08s' }}>
            Психологические <span className="hl">тесты</span>
          </h1>
          <p className="anim-fade-up max-w-xl text-lg text-muted" style={{ ['--d' as string]: '0.16s' }}>
            Открытые методики с понятной интерпретацией, графиками и аналитикой ответов. Выберите тему, пройдите
            тест за несколько минут и соберите из результатов целостный профиль личности.
          </p>
          <div className="anim-fade-up flex flex-wrap gap-3" style={{ ['--d' as string]: '0.24s' }}>
            <a href="#start" className="btn btn-primary">
              Выбрать тест
            </a>
            <Link href="/profile" className="btn btn-ghost">
              Мой профиль
            </Link>
          </div>
          <dl className="anim-fade-up grid max-w-md grid-cols-3 gap-4 pt-2" style={{ ['--d' as string]: '0.32s' }}>
            {[
              { k: 'вопросов в тестах', v: questions },
              { k: 'категорий', v: CATEGORIES.length },
              { k: 'справочных карточек', v: refs },
            ].map((s) => (
              <div key={s.k}>
                <dd className="text-3xl font-semibold">
                  <CountUp value={s.v} />
                </dd>
                <dt className="text-sm text-muted">{s.k}</dt>
              </div>
            ))}
          </dl>
        </div>
        <HeroArt />
      </section>

      <div aria-hidden="true" className="marquee -mx-4 overflow-hidden">
        <div className="marquee-track flex w-max gap-3">
          {[0, 1].flatMap((k) =>
            CATEGORIES.map((c) => (
              <span key={`${k}-${c.id}`} className={`cat-${c.id} inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm`}>
                <span className="cat-bubble inline-flex h-6 w-6 items-center justify-center rounded-full">
                  <CategoryIcon id={c.id} className="h-4 w-4" />
                </span>
                {c.title}
              </span>
            )),
          )}
        </div>
      </div>

      <section id="start" aria-labelledby="intents" className="scroll-mt-6 space-y-6">
        <Reveal>
          <h2 id="intents" className="text-2xl font-semibold tracking-tight">
            С чего начать?
          </h2>
          <p className="mt-1 text-muted">Выберите то, что вас сейчас интересует.</p>
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INTENTS.map((it, i) => {
            const t = readyTests.find((x) => x.id === it.id);
            return (
              <li key={it.id}>
                <Reveal delay={i * 60} className="h-full">
                  <Link href={`/tests/${it.id}`} className={`intent cat-${it.cat} cat-card card group flex h-full flex-col gap-3 hover:border-accent`}>
                    <span className="cat-bubble intent-icon inline-flex h-12 w-12 items-center justify-center rounded-2xl">
                      <CategoryIcon id={it.cat} className="h-7 w-7" />
                    </span>
                    <span className="text-lg font-semibold leading-snug">{it.title}</span>
                    <span className="text-[15px] text-muted">{it.text}</span>
                    <span className="mt-auto flex items-center justify-between pt-1 text-sm text-muted">
                      <span>{t ? `≈ ${t.duration} мин` : ''}</span>
                      <span aria-hidden="true" className="text-accent transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="how" className="space-y-6">
        <Reveal>
          <h2 id="how" className="text-2xl font-semibold tracking-tight">
            Как это работает
          </h2>
        </Reveal>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.n}>
              <Reveal delay={i * 120} className="h-full">
                <div className="card relative h-full space-y-2 overflow-hidden">
                  <span aria-hidden="true" className="absolute -right-3 -top-5 select-none text-8xl font-bold text-[rgb(var(--accent)/0.10)]">
                    {s.n}
                  </span>
                  <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-fg">{s.n}</span>
                  <h3 className="relative text-lg font-semibold">{s.title}</h3>
                  <p className="relative text-[15px] text-muted">{s.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
        <ul className="grid gap-3 sm:grid-cols-3" aria-label="Принципы сайта">
          {FEATURES.map((f, i) => (
            <li key={f.title}>
              <Reveal delay={i * 80}>
                <div className="card flex items-start gap-3 p-4">
                  <span className="cat-bubble inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                      <path d={f.d} />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    <p className="text-sm text-muted">{f.text}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <Reveal>
        <section aria-labelledby="teaser" className="grid items-center gap-8 overflow-hidden rounded-xl2 border border-line bg-surface p-6 sm:p-10 md:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            <h2 id="teaser" className="text-2xl font-semibold tracking-tight">
              Из ответов — в цельный профиль
            </h2>
            <p className="text-muted">
              Результаты разных тестов складываются в одну картину: сводные показатели с наложением тестов, круговая
              карта характеристик и глубинный анализ всех пунктов по научным моделям личности.
            </p>
            <Link href="/profile" className="btn btn-primary">
              Открыть профиль
            </Link>
          </div>
          <div aria-hidden="true" className="anim-float">
            <RoseChart items={DEMO} />
          </div>
        </section>
      </Reveal>

      <Catalog tests={tests} />
    </div>
  );
}
