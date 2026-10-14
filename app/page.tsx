import Link from 'next/link';
import Catalog from '@/components/Catalog';
import CategoryIcon from '@/components/CategoryIcon';
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

const PRINCIPLES = [
  { title: 'Без регистрации', text: 'Открываете тест и проходите сразу.' },
  { title: 'Всё в браузере', text: 'Ответы считаются на вашем устройстве и никуда не уходят.' },
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
      <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-20 lg:pt-6">
        <div className="space-y-8">
          <h1 className="t-display anim-fade-up max-w-[14ch]">Узнайте себя без ярлыков</h1>
          <p className="anim-fade-up max-w-[52ch] text-lg text-muted" style={{ ['--d' as string]: '0.08s' }}>
            {readyTests.length} {testsWord(readyTests.length)} с открытыми методиками. Отвечаете на вопросы, получаете разбор с
            графиками прямо в браузере, а из результатов складывается ваш целостный профиль. Без регистрации.
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

        <aside aria-labelledby="quick-title" className="anim-fade-up overflow-hidden rounded-card border border-line bg-surface" style={{ ['--d' as string]: '0.24s' }}>
          <h2 id="quick-title" className="px-6 pb-3 pt-6 font-sans text-lg font-semibold tracking-normal">
            Если есть минута
          </h2>
          <ul>
            {QUICK.map((q) => {
              const t = find(q.id);
              if (!t) return null;
              return (
                <li key={q.id} className="border-t border-line">
                  <Link href={`/tests/${q.id}`} className={`cat-${t.category} group flex items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-surface-2`}>
                    <span className="cat-bubble inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control">
                      <CategoryIcon id={t.category} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium leading-snug">{q.title}</span>
                      <span className="block text-ui text-muted">{q.text}</span>
                    </span>
                    <span className="hidden shrink-0 text-right text-meta text-muted sm:block">
                      <span className="block">≈ {t.duration} мин</span>
                      <span className="block">{t.questionCount} {plural(t.questionCount)}</span>
                    </span>
                    <Arrow className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>
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
                  className={`cat-${it.cat} cat-card group flex h-full min-h-[11rem] flex-col justify-between gap-8 rounded-card border border-line p-6 ${it.tone ? 'bg-accent-soft' : 'bg-surface'}`}
                >
                  <div className="space-y-3">
                    <span className="cat-bubble inline-flex h-10 w-10 items-center justify-center rounded-control">
                      <CategoryIcon id={it.cat} className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-2xl leading-tight">{it.title}</h3>
                    <p className="max-w-[56ch] text-ui text-muted">{it.text}</p>
                  </div>
                  <div className="flex items-center justify-between text-meta text-muted">
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

      <section aria-labelledby="privacy" className="grid gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
        <h2 id="privacy" className="t-h2 max-w-[16ch]">Ваши ответы остаются у вас</h2>
        <ul className="divide-y divide-line border-y border-line">
          {PRINCIPLES.map((p) => (
            <li key={p.title} className="grid gap-1 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
              <span className="font-semibold">{p.title}</span>
              <span className="text-muted">{p.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="teaser" className="grid items-center gap-10 rounded-card border border-line bg-surface p-8 sm:p-12 md:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <h2 id="teaser" className="t-h2">Из ответов складывается целостная картина</h2>
          <p className="max-w-[46ch] text-muted">
            Результаты разных тестов объединяются в сводные показатели, круговую карту характеристик, динамику во времени и
            отчёт для специалиста.
          </p>
          <Link href="/profile" className="btn btn-primary">
            Открыть профиль
          </Link>
        </div>
        <figure className="space-y-3">
          <div inert aria-hidden="true">
            <RoseChart items={DEMO} />
          </div>
          <figcaption className="text-center text-meta text-muted">Пример на условных данных. Ваш профиль строится из ваших результатов.</figcaption>
        </figure>
      </section>

      <Catalog tests={tests} />
    </div>
  );
}
