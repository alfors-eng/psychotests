import Link from 'next/link';
import Catalog from '@/components/Catalog';
import CategoryIcon from '@/components/CategoryIcon';
import HeroArt from '@/components/Hero';
import Reveal from '@/components/Reveal';
import RoseChart, { type RoseDatum } from '@/components/RoseChart';
import { CATEGORIES } from '@/lib/categories';
import { getAllTests, isReady, toSummary } from '@/lib/tests';
import type { CategoryId } from '@/lib/types';

/** Для тревожного или неуверенного посетителя лучший первый шаг — самый короткий тест. */
const FEATURED = {
  id: 'who-5',
  cat: 'wellbeing' as CategoryId,
  title: 'Проверить самочувствие',
  text: 'Пять коротких вопросов о настроении и энергии за последние две недели. Займёт около минуты.',
};

const INTENTS: { id: string; cat: CategoryId; title: string; text: string }[] = [
  { id: 'ipip-big5-50', cat: 'personality', title: 'Понять свой характер', text: 'Пять главных черт личности' },
  { id: 'dass-21', cat: 'emotional', title: 'Стресс и тревога', text: 'Как вы справляетесь с напряжением' },
  { id: 'rosenberg-self-esteem', cat: 'wellbeing', title: 'Самооценка', text: 'Как вы относитесь к себе' },
  { id: 'ecr-r', cat: 'relationships', title: 'Близкие отношения', text: 'Ваш стиль привязанности' },
  { id: 'riasec', cat: 'career', title: 'Выбрать профессию', text: 'Профессиональные интересы' },
  { id: 'scs-sf', cat: 'wellbeing', title: 'Доброта к себе', text: 'Самосострадание и самокритика' },
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

function testsWord(n: number) {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return 'тест';
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'теста';
  return 'тестов';
}

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
  const find = (id: string) => readyTests.find((x) => x.id === id);

  return (
    <div className="space-y-28 sm:space-y-36">
      <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="space-y-8">
          <h1 className="anim-fade-up text-[2.35rem] font-medium leading-[1.05] sm:text-6xl lg:text-[4.75rem]">
            Психологические <em className="hl not-italic">тесты</em>
          </h1>
          <p className="anim-fade-up max-w-[52ch] text-lg leading-relaxed text-muted" style={{ ['--d' as string]: '0.08s' }}>
            {readyTests.length} {testsWord(readyTests.length)} с открытыми методиками, без регистрации. Выберите тест, ответьте на вопросы и
            получите разбор с графиками прямо в браузере. Из результатов разных тестов складывается целостный профиль.
          </p>
          <div className="anim-fade-up flex flex-wrap items-center gap-3" style={{ ['--d' as string]: '0.16s' }}>
            <a href="#start" className="btn btn-primary">
              Выбрать тест
            </a>
            <Link href="/profile" className="btn btn-ghost">
              Мой профиль
            </Link>
          </div>
        </div>

        <div className="anim-fade-up rounded-[2rem] border border-line bg-surface p-4 sm:p-8" style={{ ['--d' as string]: '0.12s' }}>
          <HeroArt />
        </div>
      </section>

      <section id="start" aria-labelledby="intents" className="scroll-mt-28 space-y-8">
        <Reveal>
          <h2 id="intents" className="text-4xl font-medium sm:text-5xl">
            С чего начать?
          </h2>
          <p className="mt-3 max-w-[48ch] text-muted">Выберите то, что вас сейчас интересует. Остальное найдётся ниже.</p>
        </Reveal>

        <Reveal>
          <Link href={`/tests/${FEATURED.id}`} className={`cat-${FEATURED.cat} card group flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9`}>
            <span className="flex items-start gap-5">
              <span className="cat-bubble inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
                <CategoryIcon id={FEATURED.cat} className="h-8 w-8" />
              </span>
              <span className="space-y-2">
                <span className="font-display block text-3xl leading-tight">{FEATURED.title}</span>
                <span className="block max-w-[52ch] text-[15px] leading-relaxed text-muted">{FEATURED.text}</span>
              </span>
            </span>
            <span className="flex items-center gap-4 text-sm text-muted">
              <span>≈ {find(FEATURED.id)?.duration} мин · {find(FEATURED.id)?.questionCount} вопросов</span>
              <span aria-hidden="true" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-fg transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5">
                <Arrow />
              </span>
            </span>
          </Link>
        </Reveal>

        <ul className="divide-y divide-line border-y border-line">
          {INTENTS.map((it, i) => (
            <li key={it.id}>
              <Reveal delay={i * 50}>
                <Link href={`/tests/${it.id}`} className={`cat-${it.cat} group flex min-h-[64px] items-center gap-4 py-4 transition-colors duration-300 hover:bg-accent-soft/60 sm:px-3`}>
                  <span className="cat-bubble inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <CategoryIcon id={it.cat} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug">{it.title}</span>
                    <span className="block text-[15px] text-muted">{it.text}</span>
                  </span>
                  <span className="hidden text-sm text-muted sm:block">≈ {find(it.id)?.duration} мин</span>
                  <span aria-hidden="true" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5">
                    <Arrow />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>

        <ul className="grid gap-x-10 gap-y-4 pt-2 sm:grid-cols-3" aria-label="Принципы сайта">
          {PRINCIPLES.map((p) => (
            <li key={p.title}>
              <span className="font-semibold">{p.title}.</span> <span className="text-muted">{p.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <Reveal>
        <section aria-labelledby="teaser" className="grid items-center gap-8 rounded-[2rem] border border-line bg-surface p-8 sm:p-12 md:grid-cols-[1fr_1.1fr]">
          <div className="space-y-5">
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
          <div aria-hidden="true">
            <RoseChart items={DEMO} />
          </div>
        </section>
      </Reveal>

      <Catalog tests={tests} />
    </div>
  );
}
