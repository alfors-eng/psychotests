import Link from 'next/link';
import Catalog from '@/components/Catalog';
import CategoryIcon from '@/components/CategoryIcon';
import HeroCards, { type FanItem } from '@/components/HeroCards';
import Reveal from '@/components/Reveal';
import RoseChart, { type RoseDatum } from '@/components/RoseChart';
import { CATEGORIES, CATEGORY_SHORT } from '@/lib/categories';
import { getAllTests, isReady, toSummary } from '@/lib/tests';
import type { CategoryId } from '@/lib/types';

/** Для тревожного или неуверенного посетителя лучший первый шаг — самый короткий тест. */
const FEATURED = {
  id: 'who-5',
  cat: 'wellbeing' as CategoryId,
  title: 'Проверить самочувствие',
  text: 'Пять коротких вопросов о настроении и энергии за последние две недели.',
};

const INTENTS: { id: string; cat: CategoryId; title: string; text: string; wide?: boolean }[] = [
  { id: 'ipip-big5-50', cat: 'personality', title: 'Понять свой характер', text: 'Пять главных черт личности' },
  { id: 'dass-21', cat: 'emotional', title: 'Стресс и тревога', text: 'Как вы справляетесь с напряжением' },
  { id: 'ecr-r', cat: 'relationships', title: 'Близкие отношения', text: 'Ваш стиль привязанности' },
  { id: 'erq', cat: 'eq', title: 'Управление эмоциями', text: 'Как вы справляетесь с чувствами' },
  { id: 'riasec', cat: 'career', title: 'Выбрать профессию', text: 'Профессиональные интересы', wide: true },
  { id: 'rosenberg-self-esteem', cat: 'wellbeing', title: 'Самооценка', text: 'Как вы относитесь к себе', wide: true },
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

function Arrow({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
    </svg>
  );
}

export default function HomePage() {
  const all = getAllTests();
  const tests = all.map(toSummary);
  const readyTests = all.filter(isReady);
  const find = (id: string) => readyTests.find((x) => x.id === id);
  const featured = find(FEATURED.id);

  const fan: FanItem[] = ([
    { id: 'ipip-big5-50', cat: 'personality', title: 'Big Five', hint: 'Пять черт характера', art: 'radar', x: '-0.5', y: '1.5rem', r: '-8deg', d: '0.15s' },
    { id: 'ecr-r', cat: 'relationships', title: 'Привязанность', hint: 'Как вы любите и доверяете', art: 'pair', x: '0.5', y: '2.5rem', r: '8deg', d: '0.3s' },
    { id: 'who-5', cat: 'wellbeing', title: 'Самочувствие', hint: 'Проверка за минуту', art: 'ring', x: '0', y: '-0.5rem', r: '1deg', d: '0s' },
  ] as Omit<FanItem, 'minutes' | 'questions'>[]).map((c) => ({ ...c, minutes: find(c.id)?.duration ?? 0, questions: find(c.id)?.questionCount ?? 0 }));

  return (
    <div className="relative space-y-24 sm:space-y-32">
      <section className="relative grid items-center gap-10 lg:grid-cols-[1fr_30rem] lg:gap-6 xl:grid-cols-[1fr_34rem]">
        <div aria-hidden="true" className="aura" />
        <div className="space-y-8">
          <h1 className="display anim-fade-up">
            Узнайте <span aria-hidden="true" className="pill-inline" /> себя <em>без ярлыков</em>
          </h1>
          <p className="anim-fade-up max-w-[50ch] text-lg leading-relaxed text-muted" style={{ ['--d' as string]: '0.1s' }}>
            {readyTests.length} {testsWord(readyTests.length)} с открытыми методиками. Отвечаете на вопросы, получаете разбор с
            графиками прямо в браузере, а из результатов складывается ваш целостный профиль. Без регистрации.
          </p>
          <div className="anim-fade-up flex flex-wrap items-center gap-3" style={{ ['--d' as string]: '0.2s' }}>
            <a href="#start" className="btn btn-primary">
              Выбрать тест
            </a>
            <Link href="/profile" className="btn btn-ghost">
              Мой профиль
            </Link>
          </div>
        </div>
        <HeroCards items={fan} />
      </section>

      <div aria-hidden="true" className="marquee -mx-4 sm:-mx-2">
        <div className="marquee-track flex w-max">
          {[0, 1].map((n) => (
            <div key={n} className={`marquee-set ${n ? 'marquee-dup' : ''}`}>
              {CATEGORIES.map((c) => (
                <span key={c.id} className={`tile cat-${c.id} inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-medium`}>
                  <CategoryIcon id={c.id} className="h-5 w-5" />
                  {CATEGORY_SHORT[c.id]}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section id="start" aria-labelledby="intents" className="scroll-mt-28 space-y-10">
        <Reveal>
          <h2 id="intents" className="text-5xl font-medium sm:text-6xl">
            С чего <em className="text-accent">начать?</em>
          </h2>
          <p className="mt-4 max-w-[48ch] text-lg text-muted">Выберите то, что вас сейчас интересует. Остальное найдётся ниже.</p>
        </Reveal>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <li className="min-w-0 sm:col-span-2 lg:row-span-2">
            <Reveal className="h-full">
              <Link href={`/tests/${FEATURED.id}`} className={`tile cat-${FEATURED.cat} group relative flex h-full min-h-[24rem] flex-col justify-between overflow-hidden rounded-[2rem] p-6 sm:p-10`}>
                <span className="font-display pointer-events-none absolute -right-4 -top-6 select-none text-[11rem] font-medium leading-none opacity-[0.14] sm:text-[15rem]" aria-hidden="true">
                  {featured?.duration}
                </span>
                <span className="relative space-y-4">
                  <span className="tile-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium">
                    Рекомендуем начать здесь
                  </span>
                  <span className="font-display block max-w-[12ch] text-4xl leading-[1.02] sm:text-6xl">{FEATURED.title}</span>
                  <span className="tile-muted block max-w-[40ch] text-base leading-relaxed">{FEATURED.text}</span>
                </span>
                <span className="relative mt-10 flex items-center justify-between">
                  <span className="text-sm font-medium">≈ {featured?.duration} мин · {featured?.questionCount} вопросов</span>
                  <span aria-hidden="true" className="tile-go inline-flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-1">
                    <Arrow className="h-5 w-5" />
                  </span>
                </span>
              </Link>
            </Reveal>
          </li>
          {INTENTS.map((it, i) => (
            <li key={it.id} className={`min-w-0 ${it.wide ? 'lg:col-span-2' : ''}`}>
              <Reveal delay={i * 70} className="h-full">
                <Link href={`/tests/${it.id}`} className={`tile cat-${it.cat} group flex h-full min-h-[11.5rem] flex-col justify-between gap-6 rounded-[1.75rem] p-6`}>
                  <span className="tile-chip inline-flex h-11 w-11 items-center justify-center rounded-full">
                    <CategoryIcon id={it.cat} className="h-6 w-6" />
                  </span>
                  <span className="flex items-end justify-between gap-3">
                    <span className="space-y-1">
                      <span className="font-display block text-2xl leading-tight">{it.title}</span>
                      <span className="tile-muted block text-sm">
                        {it.text} · ≈ {find(it.id)?.duration} мин
                      </span>
                    </span>
                    <span aria-hidden="true" className="tile-go inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5">
                      <Arrow />
                    </span>
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <Reveal>
        <section aria-labelledby="privacy" className="space-y-8">
          <h2 id="privacy" className="max-w-[20ch] text-4xl font-medium leading-[1.05] sm:text-6xl lg:text-7xl">
            Ответы остаются <em className="text-accent">только у вас</em>
          </h2>
          <ul className="grid gap-x-10 gap-y-3 text-lg sm:grid-cols-3" aria-label="Принципы сайта">
            <li>
              <span className="font-semibold">Без регистрации.</span> <span className="text-muted">Открываете тест и проходите сразу.</span>
            </li>
            <li>
              <span className="font-semibold">Всё в браузере.</span> <span className="text-muted">Ответы считаются на вашем устройстве и никуда не уходят.</span>
            </li>
            <li>
              <span className="font-semibold">Открытые методики.</span> <span className="text-muted">Источник и лицензия указаны в каждой карточке.</span>
            </li>
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <section
          aria-labelledby="teaser"
          className="grid items-center gap-8 rounded-[2.25rem] border border-white/10 bg-[rgb(var(--tint))] p-8 text-[#f7f3ec] shadow-[0_40px_60px_-40px_rgb(var(--tint)/0.8)] sm:p-12 md:grid-cols-[1fr_1.1fr]"
        >
          <div className="space-y-6">
            <h2 id="teaser" className="text-4xl font-medium leading-[1.05] sm:text-5xl">
              Из ответов — <em className="text-[rgb(240_196_96)]">в цельную картину</em>
            </h2>
            <p className="max-w-[46ch] leading-relaxed text-[#f7f3ec]/80">
              Результаты разных тестов складываются в сводные показатели с наложением, круговую карту характеристик
              и глубинный анализ всех пунктов по научным моделям личности.
            </p>
            <Link href="/profile" className="btn btn-light">
              Открыть профиль
            </Link>
          </div>
          <div aria-hidden="true" className="rounded-[1.75rem] bg-surface p-4 text-ink">
            <RoseChart items={DEMO} />
          </div>
        </section>
      </Reveal>

      <Catalog tests={tests} />
    </div>
  );
}
