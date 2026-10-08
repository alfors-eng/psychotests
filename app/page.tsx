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

const FEATURED = { id: 'ipip-big5-50', cat: 'personality' as CategoryId, title: 'Понять свой характер', text: 'Пять главных черт личности: общительность, доброжелательность, добросовестность, эмоциональная чувствительность и открытость опыту.' };

const INTENTS: { id: string; cat: CategoryId; title: string; text: string }[] = [
  { id: 'dass-21', cat: 'emotional', title: 'Стресс и тревога', text: 'Как вы справляетесь с напряжением' },
  { id: 'who-5', cat: 'wellbeing', title: 'Самочувствие', text: 'Проверка за минуту' },
  { id: 'rosenberg-self-esteem', cat: 'wellbeing', title: 'Самооценка', text: 'Как вы относитесь к себе' },
  { id: 'ecr-r', cat: 'relationships', title: 'Близкие отношения', text: 'Ваш стиль привязанности' },
  { id: 'riasec', cat: 'career', title: 'Выбрать профессию', text: 'Профессиональные интересы' },
  { id: 'brief-cope', cat: 'emotional', title: 'Как я справляюсь', text: 'Стратегии совладания' },
  { id: 'scs-sf', cat: 'wellbeing', title: 'Доброта к себе', text: 'Самосострадание и самокритика' },
  { id: 'bat-12', cat: 'emotional', title: 'Выгорание', text: 'Усталость от работы' },
];

const STEPS = [
  { n: '01', title: 'Выберите тест', text: 'По теме или через поиск. Время и число вопросов видны в карточке.' },
  { n: '02', title: 'Ответьте на вопросы', text: 'Один вопрос на экран, цифры на клавиатуре, прогресс сохраняется.' },
  { n: '03', title: 'Получите разбор', text: 'Баллы, графики, объяснение и аналитика ваших ответов прямо в браузере.' },
];

const PRINCIPLES = [
  { title: 'Без регистрации', text: 'Открываете тест и проходите сразу.' },
  { title: 'Данные только у вас', text: 'Ответы считаются в браузере и никуда не уходят.' },
  { title: 'Открытые методики', text: 'Источник и лицензия указаны в каждой карточке.' },
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

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
    </svg>
  );
}

export default function HomePage() {
  const all = getAllTests();
  const tests = all.map(toSummary);
  const readyTests = all.filter(isReady);
  const questions = readyTests.reduce((a, t) => a + t.questionCount, 0);
  const refs = all.length - readyTests.length;
  const minutes = (id: string) => readyTests.find((x) => x.id === id)?.duration;

  return (
    <div className="space-y-32 sm:space-y-40">
      {/* Герой: редакционная раскладка с крупной антиквой и «вложенной» иллюстрацией */}
      <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="space-y-8">
          <p className="eyebrow anim-fade-up">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="anim-pulse absolute inset-0 rounded-full" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
            <span>
              <CountUp value={readyTests.length} /> тестов · без регистрации
            </span>
          </p>
          <h1 className="anim-fade-up text-[2.35rem] font-medium leading-[1.05] sm:text-6xl lg:text-[4.75rem]" style={{ ['--d' as string]: '0.08s' }}>
            Психологические <em className="hl not-italic">тесты</em>
          </h1>
          <p className="anim-fade-up max-w-[52ch] text-lg leading-relaxed text-muted" style={{ ['--d' as string]: '0.16s' }}>
            Открытые методики с понятной интерпретацией, графиками и аналитикой ваших ответов. Из результатов разных
            тестов складывается целостный профиль личности.
          </p>
          <div className="anim-fade-up flex flex-wrap items-center gap-3" style={{ ['--d' as string]: '0.24s' }}>
            <a href="#start" className="btn btn-primary">
              Выбрать тест
            </a>
            <Link href="/profile" className="btn btn-ghost">
              Мой профиль
            </Link>
          </div>
          <dl className="anim-fade-up grid max-w-lg grid-cols-3 gap-0 pt-4" style={{ ['--d' as string]: '0.32s' }}>
            {[
              { k: 'вопросов в тестах', v: questions },
              { k: 'категорий', v: CATEGORIES.length },
              { k: 'справочных карточек', v: refs },
            ].map((s, i) => (
              <div key={s.k} className={i ? 'border-l border-line pl-5' : 'pr-5'}>
                <dd className="font-display text-4xl">
                  <CountUp value={s.v} />
                </dd>
                <dt className="mt-1 text-sm text-muted">{s.k}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="shell anim-fade-up" style={{ ['--d' as string]: '0.2s' }}>
          <div className="core mesh p-4 sm:p-8">
            <HeroArt />
          </div>
        </div>
      </section>

      {/* Куда пойти: асимметричная сетка, одна крупная карточка */}
      <section id="start" aria-labelledby="intents" className="scroll-mt-28 space-y-10">
        <Reveal>
          <p className="eyebrow">Начать</p>
          <h2 id="intents" className="mt-4 text-4xl font-medium sm:text-5xl">
            С чего начать?
          </h2>
          <p className="mt-3 max-w-[48ch] text-muted">Выберите то, что вас сейчас интересует, — остальное найдётся ниже.</p>
        </Reveal>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <li className="sm:col-span-2 lg:row-span-2">
            <Reveal className="h-full">
              <Link href={`/tests/${FEATURED.id}`} className={`intent cat-${FEATURED.cat} cat-card card group relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden p-8 sm:p-10`}>
                <span aria-hidden="true" className="mesh pointer-events-none absolute inset-0 opacity-80" />
                <div className="relative space-y-5">
                  <span className="eyebrow">Рекомендуем начать</span>
                  <span className="cat-bubble intent-icon inline-flex h-14 w-14 items-center justify-center rounded-2xl">
                    <CategoryIcon id={FEATURED.cat} className="h-8 w-8" />
                  </span>
                  <span className="font-display block text-3xl leading-tight sm:text-4xl">{FEATURED.title}</span>
                  <span className="block max-w-[44ch] text-[15px] leading-relaxed text-muted">{FEATURED.text}</span>
                </div>
                <span className="relative mt-8 flex items-center justify-between text-sm text-muted">
                  <span>≈ {minutes(FEATURED.id)} мин · 50 вопросов</span>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-fg transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5">
                    <Arrow />
                  </span>
                </span>
              </Link>
            </Reveal>
          </li>
          {INTENTS.map((it, i) => (
            <li key={it.id}>
              <Reveal delay={(i % 4) * 70 + 60} className="h-full">
                <Link href={`/tests/${it.id}`} className={`intent cat-${it.cat} cat-card card group flex h-full flex-col gap-4 p-6`}>
                  <span className="cat-bubble intent-icon inline-flex h-11 w-11 items-center justify-center rounded-2xl">
                    <CategoryIcon id={it.cat} className="h-6 w-6" />
                  </span>
                  <span className="space-y-1">
                    <span className="block text-lg font-semibold leading-snug">{it.title}</span>
                    <span className="block text-[15px] text-muted">{it.text}</span>
                  </span>
                  <span className="mt-auto flex items-center justify-between pt-1 text-sm text-muted">
                    <span>≈ {minutes(it.id)} мин</span>
                    <span aria-hidden="true" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5">
                      <Arrow />
                    </span>
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Как это работает: крупные цифры и тонкие разделители вместо карточек */}
      <section aria-labelledby="how" className="space-y-12">
        <Reveal>
          <p className="eyebrow">Процесс</p>
          <h2 id="how" className="mt-4 text-4xl font-medium sm:text-5xl">
            Как это работает
          </h2>
        </Reveal>
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.n}>
              <Reveal delay={i * 120}>
                <div className="hairline-t space-y-4 pt-6">
                  <span aria-hidden="true" className="numeral block text-6xl font-medium text-[rgb(var(--accent)/0.55)]">
                    {s.n}
                  </span>
                  <h3 className="text-xl font-semibold">{s.title}</h3>
                  <p className="max-w-[34ch] text-[15px] leading-relaxed text-muted">{s.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
        <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-3" aria-label="Принципы сайта">
          {PRINCIPLES.map((p, i) => (
            <li key={p.title}>
              <Reveal delay={i * 80}>
                <p className="flex items-baseline gap-3">
                  <span aria-hidden="true" className="inline-block h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-full bg-accent" />
                  <span>
                    <span className="font-semibold">{p.title}.</span> <span className="text-muted">{p.text}</span>
                  </span>
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Витрина профиля */}
      <Reveal>
        <section aria-labelledby="teaser" className="shell">
          <div className="core mesh grid items-center gap-8 p-8 sm:p-12 md:grid-cols-[1fr_1.1fr]">
            <div className="space-y-5">
              <p className="eyebrow">Профиль</p>
              <h2 id="teaser" className="text-4xl font-medium leading-tight sm:text-5xl">
                Из ответов — в цельную картину
              </h2>
              <p className="max-w-[46ch] leading-relaxed text-muted">
                Результаты разных тестов складываются в сводные показатели с наложением, круговую карту характеристик
                и глубинный анализ всех пунктов по научным моделям личности.
              </p>
              <Link href="/profile" className="btn btn-primary">
                Открыть профиль
              </Link>
            </div>
            <div aria-hidden="true" className="anim-float">
              <RoseChart items={DEMO} />
            </div>
          </div>
        </section>
      </Reveal>

      <Catalog tests={tests} />
    </div>
  );
}
