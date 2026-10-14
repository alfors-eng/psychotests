import Link from 'next/link';
import Catalog from '@/components/Catalog';
import CategoryIcon from '@/components/CategoryIcon';
import HeroArt from '@/components/HeroArt';
import RoseChart, { type RoseDatum } from '@/components/RoseChart';
import { CATEGORIES } from '@/lib/categories';
import { plural } from '@/lib/format';
import { getAllTests, isReady, toSummary } from '@/lib/tests';
import type { CategoryId } from '@/lib/types';

/** Тесты «на одну минуту»: время и число вопросов берутся из данных теста. */
const QUICK: { id: string; title: string; text: string }[] = [
  { id: 'who-5', title: 'Самочувствие', text: 'Настроение и энергия за последние две недели' },
  { id: 'phq-4', title: 'Тревога и настроение', text: 'Сверхкраткий скрининг из четырёх вопросов' },
  { id: 'tipi', title: 'Черты характера', text: 'Большая пятёрка в десяти утверждениях' },
  { id: 'brs', title: 'Устойчивость', text: 'Как вы восстанавливаетесь после трудностей' },
];

const INTENTS: { id: string; cat: CategoryId; title: string; text: string; span: string; tone?: boolean }[] = [
  { id: 'ipip-big5-50', cat: 'personality', title: 'Понять свой характер', text: 'Пять главных черт личности: общительность, доброжелательность, добросовестность, эмоциональная чувствительность и открытость опыту.', span: 'md:col-span-4', tone: true },
  { id: 'dass-21', cat: 'emotional', title: 'Стресс и тревога', text: 'Как вы справляетесь с напряжением', span: 'md:col-span-2' },
  { id: 'ecr-r', cat: 'relationships', title: 'Близкие отношения', text: 'Ваш стиль привязанности', span: 'md:col-span-2' },
  { id: 'erq', cat: 'eq', title: 'Управление эмоциями', text: 'Как вы справляетесь с чувствами', span: 'md:col-span-2' },
  { id: 'rosenberg-self-esteem', cat: 'wellbeing', title: 'Самооценка', text: 'Как вы относитесь к себе', span: 'md:col-span-2' },
  { id: 'riasec', cat: 'career', title: 'Выбрать профессию', text: 'Профессиональные интересы по модели Холланда: от практических занятий до работы с людьми и идеями.', span: 'md:col-span-6', tone: true },
];

const PRINCIPLES: { title: string; text: string; cat: CategoryId }[] = [
  { title: 'Без регистрации', text: 'Открываете тест и проходите сразу.', cat: 'eq' },
  { title: 'Всё в браузере', text: 'Ответы считаются на вашем устройстве и никуда не уходят.', cat: 'neurodiversity' },
  { title: 'Открытые методики', text: 'Источник и лицензия указаны в каждой карточке.', cat: 'personality' },
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
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function HomePage() {
  const all = getAllTests();
  const tests = all.map(toSummary);
  const readyTests = all.filter(isReady);
  const find = (id: string) => readyTests.find((x) => x.id === id);

  return (
    <div className="space-y-[var(--space-section)]">
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div className="space-y-8">
          <p className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-meta text-muted">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            Без регистрации, ответы остаются в браузере
          </p>
          <h1 className="t-display anim-fade-up max-w-[14ch]" style={{ ['--d' as string]: '0.06s' }}>
            Узнайте себя <span className="text-accent">без ярлыков</span>
          </h1>
          <p className="anim-fade-up max-w-[52ch] text-lg text-muted" style={{ ['--d' as string]: '0.14s' }}>
            {readyTests.length} {testsWord(readyTests.length)} с открытыми методиками. Отвечаете на вопросы, получаете разбор с
            графиками прямо в браузере, а из результатов складывается ваш целостный профиль.
          </p>
          <div className="anim-fade-up flex flex-wrap items-center gap-3" style={{ ['--d' as string]: '0.22s' }}>
            <a href="#start" className="btn btn-primary">
              Выбрать тест
            </a>
            <Link href="/profile" className="btn btn-ghost">
              Мой профиль
            </Link>
          </div>
        </div>
        <div className="anim-fade-up" style={{ ['--d' as string]: '0.2s' }}>
          <HeroArt />
        </div>
      </section>

      <section aria-labelledby="quick-title" className="-mt-8 space-y-5 sm:-mt-12">
        <h2 id="quick-title" className="font-sans text-lg font-semibold tracking-normal">
          Если есть минута
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK.map((q) => {
            const t = find(q.id);
            if (!t) return null;
            return (
              <li key={q.id} className={`cat-${t.category}`}>
                <Link href={`/tests/${q.id}`} className="tint-card group flex h-full flex-col gap-4 p-5">
                  <CategoryIcon id={t.category} className="tint-mark" />
                  <span className="cat-bubble inline-flex h-11 w-11 items-center justify-center rounded-control">
                    <CategoryIcon id={t.category} className="h-6 w-6" />
                  </span>
                  <span className="relative space-y-1">
                    <span className="block font-display text-xl leading-tight">{q.title}</span>
                    <span className="block text-ui text-muted">{q.text}</span>
                  </span>
                  <span className="relative mt-auto flex items-center justify-between text-meta text-muted">
                    <span>≈ {t.duration} мин, {t.questionCount} {plural(t.questionCount)}</span>
                    <Arrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="start" aria-labelledby="intents" className="space-y-10">
        <div className="space-y-3">
          <h2 id="intents" className="t-h2">С чего начать?</h2>
          <p className="max-w-[48ch] text-muted">Выберите то, что вас сейчас интересует. Остальное найдётся ниже.</p>
        </div>

        <ul className="grid gap-4 md:grid-cols-6">
          {INTENTS.map((it) => {
            const t = find(it.id);
            return (
              <li key={it.id} className={it.span}>
                <Link
                  href={`/tests/${it.id}`}
                  className={`cat-${it.cat} tint-card group flex h-full min-h-[12rem] flex-col justify-between gap-8 p-6`}
                >
                  <CategoryIcon id={it.cat} className="tint-mark" />
                  <div className="relative space-y-3">
                    <span className="cat-bubble inline-flex h-10 w-10 items-center justify-center rounded-control">
                      <CategoryIcon id={it.cat} className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-2xl leading-tight">{it.title}</h3>
                    <p className="max-w-[56ch] text-ui text-muted">{it.text}</p>
                  </div>
                  <div className="relative flex items-center justify-between text-meta text-muted">
                    <span>
                      ≈ {t?.duration} мин, {t?.questionCount} {plural(t?.questionCount ?? 0)}
                    </span>
                    <Arrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="privacy" className="space-y-10">
        <h2 id="privacy" className="t-h2 max-w-[18ch]">Ваши ответы остаются у вас</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <li key={p.title} className={`cat-${p.cat} tint-card space-y-4 p-6`}>
              <span className="cat-bubble inline-flex h-11 w-11 items-center justify-center rounded-control">
                <CategoryIcon id={p.cat} className="h-6 w-6" />
              </span>
              <h3 className="font-display text-2xl leading-tight">{p.title}</h3>
              <p className="text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="teaser" className="relative isolate overflow-hidden rounded-card bg-[rgb(var(--band))] p-8 text-[rgb(var(--band-fg))] sm:p-12">
        <div aria-hidden="true" className="dot-grid absolute -right-24 -top-24 -z-10 h-[34rem] w-[34rem] opacity-30" />
        <div className="grid items-center gap-10 md:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <h2 id="teaser" className="t-h2">Из ответов складывается целостная картина</h2>
            <p className="max-w-[46ch] text-[rgb(var(--band-muted))]">
              Результаты разных тестов объединяются в сводные показатели, круговую карту характеристик, динамику во времени и
              отчёт для специалиста.
            </p>
            <Link href="/profile" className="btn bg-[rgb(var(--band-fg))] text-[rgb(var(--band))] hover:opacity-90">
              Открыть профиль
            </Link>
          </div>
          <figure className="space-y-3">
            <div inert aria-hidden="true" className="rounded-card bg-surface p-4 text-ink">
              <RoseChart items={DEMO} />
            </div>
            <figcaption className="text-center text-meta text-[rgb(var(--band-muted))]">Пример на условных данных. Ваш профиль строится из ваших результатов.</figcaption>
          </figure>
        </div>
      </section>

      <Catalog tests={tests} />
    </div>
  );
}
