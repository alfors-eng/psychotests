'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import CategoryIcon from '@/components/CategoryIcon';
import Reveal from '@/components/Reveal';
import { CATEGORIES, categoryTitle } from '@/lib/categories';
import { plural } from '@/lib/format';
import type { CategoryId, TestSummary } from '@/lib/types';

function TestCard({ t, featured = false, index = 0 }: { t: TestSummary; featured?: boolean; index?: number }) {
  const draft = t.status === 'draft';
  const ref = t.status === 'reference';
  return (
    <li className={`cat-${t.category}`}>
      <Reveal delay={Math.min(index, 8) * 55} className="h-full">
        <Link
          href={`/tests/${t.id}`}
          className={`card cat-card flex h-full flex-col gap-3 hover:border-accent ${featured ? 'p-6' : ''} ${ref ? 'border-dashed' : ''}`}
        >
          <div className="flex items-start justify-between gap-3">
            <span className={`cat-bubble inline-flex items-center justify-center rounded-2xl ${featured ? 'h-14 w-14' : 'h-11 w-11'}`}>
              <CategoryIcon id={t.category} className={featured ? 'h-8 w-8' : 'h-6 w-6'} />
            </span>
            <div className="flex flex-wrap justify-end gap-1.5 text-xs">
              {draft && <span className="rounded-full bg-warm-soft px-2.5 py-1 font-medium text-warm">Скоро</span>}
              {ref && <span className="rounded-full border border-line px-2.5 py-1 font-medium text-muted">Ссылка</span>}
              {!draft && !ref && t.mode === 'external' && (
                <span className="rounded-full bg-warm-soft px-2.5 py-1 font-medium text-warm">Ввод ответов</span>
              )}
              {t.isClinical && !draft && !ref && (
                <span className="rounded-full border border-line px-2.5 py-1 text-muted">Скрининг</span>
              )}
            </div>
          </div>
          <h3 className={`font-semibold leading-snug ${featured ? 'text-xl' : 'text-lg'}`}>{t.title}</h3>
          <p className="text-[15px] text-muted">{t.shortDescription}</p>
          {ref ? (
            <p className="mt-auto pt-1 text-sm text-muted">
              {t.analogs && t.analogs.length
                ? `Открытых аналогов на сайте: ${t.analogs.length}`
                : 'Открытого аналога на сайте пока нет'}
            </p>
          ) : (
            <p className="mt-auto flex items-center gap-3 pt-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7.5V12l3 2" />
                </svg>
                ≈ {t.duration} мин
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t.questionCount} {plural(t.questionCount)}
              </span>
            </p>
          )}
        </Link>
      </Reveal>
    </li>
  );
}

export default function Catalog({ tests }: { tests: TestSummary[] }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tests.filter(
      (t) =>
        (cat === 'all' || t.category === cat) &&
        (!needle ||
          [t.title, t.shortDescription, ...t.tags, categoryTitle(t.category)]
            .join(' ')
            .toLowerCase()
            .includes(needle)),
    );
  }, [tests, q, cat]);

  const isRef = (t: TestSummary) => t.status === 'reference';
  const available = filtered.filter((t) => !isRef(t));
  const references = filtered.filter(isRef);
  const readyAll = tests.filter((t) => !isRef(t));

  const filtering = q.trim() !== '' || cat !== 'all';
  const popular = readyAll.filter((t) => t.popular && t.status !== 'draft');
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of tests) if (t.status !== 'reference') m[t.category] = (m[t.category] ?? 0) + 1;
    return m;
  }, [tests]);

  const grouped = CATEGORIES.map((c) => ({ c, items: available.filter((t) => t.category === c.id) })).filter((g) => g.items.length);

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <label htmlFor="search" className="sr-only">
          Поиск по тестам
        </label>
        <div className="relative">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            id="search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Найти тест: тревога, личность, самооценка…"
            className="min-h-[52px] w-full rounded-full border border-line bg-surface pl-12 pr-5 text-base shadow-sm transition-shadow placeholder:text-muted focus:shadow-md"
          />
        </div>
        <div role="group" aria-label="Категории" className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={cat === 'all'}
            onClick={() => setCat('all')}
            className={`min-h-[44px] rounded-full border px-4 text-sm transition-colors ${
              cat === 'all' ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-surface hover:bg-accent-soft'
            }`}
          >
            Все ({readyAll.length})
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={cat === c.id}
              onClick={() => setCat(c.id)}
              className={`cat-${c.id} inline-flex min-h-[44px] items-center gap-2 rounded-full border px-3.5 text-sm transition-colors ${
                cat === c.id ? 'border-transparent bg-accent text-accent-fg' : 'border-line bg-surface hover:bg-accent-soft'
              }`}
            >
              <span className={cat === c.id ? '' : 'cat-bubble inline-flex h-6 w-6 items-center justify-center rounded-full'}>
                <CategoryIcon id={c.id} className="h-4 w-4" />
              </span>
              {c.title} <span className="text-xs opacity-70">{counts[c.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {!filtering && popular.length > 0 && (
        <section aria-labelledby="popular">
          <h2 id="popular" className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <span aria-hidden="true" className="inline-block h-5 w-1.5 rounded-full bg-accent" />
            Популярные
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((t, i) => (
              <TestCard key={t.id} t={t} featured index={i} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="all" className="space-y-10">
        <h2 id="all" className="flex items-center gap-2 text-xl font-semibold">
          <span aria-hidden="true" className="inline-block h-5 w-1.5 rounded-full bg-accent" />
          {filtering ? 'Найдено' : 'Все тесты'}{' '}
          <span className="text-base font-normal text-muted" aria-live="polite">
            ({available.length})
          </span>
        </h2>
        {grouped.length ? (
          grouped.map(({ c, items }) => (
            <div key={c.id} className={`cat-${c.id} space-y-4`}>
              <h3 className="flex items-center gap-3 text-lg font-semibold">
                <span className="cat-bubble inline-flex h-9 w-9 items-center justify-center rounded-xl">
                  <CategoryIcon id={c.id} className="h-5 w-5" />
                </span>
                {c.title}
              </h3>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((t, i) => (
                  <TestCard key={t.id} t={t} index={i} />
                ))}
              </ul>
            </div>
          ))
        ) : references.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 py-10 text-center">
            <svg viewBox="0 0 64 64" className="h-14 w-14 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
              <circle cx="28" cy="28" r="14" />
              <path d="m38 38 12 12M22 28h12" />
            </svg>
            <p className="text-muted">Ничего не нашлось. Попробуйте другой запрос или категорию.</p>
          </div>
        ) : null}
      </section>

      {references.length > 0 && (
        <section aria-labelledby="refs" className="space-y-4">
          <div>
            <h2 id="refs" className="flex items-center gap-2 text-xl font-semibold">
              <span aria-hidden="true" className="inline-block h-5 w-1.5 rounded-full bg-[rgb(var(--warm))]" />
              Известные методики: ссылки и открытые аналоги{' '}
              <span className="text-base font-normal text-muted">({references.length})</span>
            </h2>
            <p className="mt-1 max-w-2xl text-[15px] text-muted">
              Эти методики защищены лицензией, поэтому вопросов здесь нет. В карточке — официальный источник и
              открытые тесты на сайте, которые можно пройти вместо них.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {references.map((t, i) => (
              <TestCard key={t.id} t={t} index={i} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
