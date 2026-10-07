'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CATEGORIES, categoryTitle } from '@/lib/categories';
import { plural } from '@/lib/format';
import type { CategoryId, TestSummary } from '@/lib/types';

function TestCard({ t }: { t: TestSummary }) {
  const draft = t.status === 'draft';
  return (
    <li>
      <Link
        href={`/tests/${t.id}`}
        className="card flex h-full flex-col gap-3 transition-colors hover:border-accent"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-accent-soft px-2.5 py-1 font-medium text-accent">
            {categoryTitle(t.category)}
          </span>
          {!draft && t.mode === 'external' && (
            <span className="rounded-full bg-warm-soft px-2.5 py-1 font-medium text-warm">Ввод ответов</span>
          )}
          {draft && <span className="rounded-full bg-warm-soft px-2.5 py-1 font-medium text-warm">Скоро</span>}
        </div>
        <h3 className="text-lg font-semibold leading-snug">{t.title}</h3>
        <p className="text-[15px] text-muted">{t.shortDescription}</p>
        <p className="mt-auto pt-1 text-sm text-muted">
          ≈ {t.duration} мин · {t.questionCount} {plural(t.questionCount)}
        </p>
      </Link>
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

  const filtering = q.trim() !== '' || cat !== 'all';
  const popular = tests.filter((t) => t.popular && t.status !== 'draft');

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <label htmlFor="search" className="sr-only">
          Поиск по тестам
        </label>
        <input
          id="search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Найти тест: тревога, личность, самооценка…"
          className="min-h-[48px] w-full rounded-full border border-line bg-surface px-5 text-base placeholder:text-muted"
        />
        <div role="group" aria-label="Категории" className="flex flex-wrap gap-2">
          {[{ id: 'all' as const, title: 'Все' }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={cat === c.id}
              onClick={() => setCat(c.id)}
              className={`min-h-[40px] rounded-full border px-4 text-sm transition-colors ${
                cat === c.id
                  ? 'border-accent bg-accent text-accent-fg'
                  : 'border-line bg-surface hover:bg-accent-soft'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {!filtering && popular.length > 0 && (
        <section aria-labelledby="popular">
          <h2 id="popular" className="mb-4 text-xl font-semibold">
            Популярные
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((t) => (
              <TestCard key={t.id} t={t} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="all">
        <h2 id="all" className="mb-4 text-xl font-semibold">
          {filtering ? 'Найдено' : 'Все тесты'}{' '}
          <span className="text-base font-normal text-muted" aria-live="polite">
            ({filtered.length})
          </span>
        </h2>
        {filtered.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <TestCard key={t.id} t={t} />
            ))}
          </ul>
        ) : (
          <p className="text-muted">Ничего не нашлось. Попробуйте другой запрос или категорию.</p>
        )}
      </section>
    </div>
  );
}
