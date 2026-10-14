'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import CategoryIcon from '@/components/CategoryIcon';
import { CATEGORIES, categoryTitle } from '@/lib/categories';
import { plural } from '@/lib/format';
import type { CategoryId, TestSummary } from '@/lib/types';

const GRID = 'grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4';

function Badge({ children, tone = 'line' }: { children: React.ReactNode; tone?: 'line' | 'warm' }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone === 'warm' ? 'bg-warm-soft text-warm' : 'border border-line-strong text-muted'}`}>{children}</span>
  );
}

function TestCard({ t, itemClass = '' }: { t: TestSummary; itemClass?: string }) {
  const draft = t.status === 'draft';
  const ref = t.status === 'reference';
  return (
    <li className={`cat-${t.category} ${itemClass}`.trim()}>
      <Link
        href={`/tests/${t.id}`}
        className={`${ref ? 'card cat-card border-dashed border-line-strong' : 'tint-card'} flex h-full flex-col gap-3 p-4 sm:p-5`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="cat-bubble inline-flex h-9 w-9 items-center justify-center rounded-control">
            <CategoryIcon id={t.category} className="h-5 w-5" />
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {draft && <Badge tone="warm">Скоро</Badge>}
            {ref && <Badge>Ссылка</Badge>}
            {!draft && !ref && t.mode === 'external' && <Badge tone="warm">Ввод ответов</Badge>}
            {t.isClinical && !draft && !ref && <Badge>Скрининг</Badge>}
          </div>
        </div>
        <h3 className="text-[1.0625rem] font-semibold leading-snug">{t.title}</h3>
        <p className="hidden text-ui text-muted sm:line-clamp-3 sm:block">{t.shortDescription}</p>
        {ref ? (
          <p className="mt-auto text-meta text-muted">
            {t.analogs && t.analogs.length ? `Открытых аналогов на сайте: ${t.analogs.length}` : 'Открытого аналога на сайте пока нет'}
          </p>
        ) : (
          <p className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-muted">
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" />
              </svg>
              ≈ {t.duration} мин
            </span>
            <span>
              {t.questionCount} {plural(t.questionCount)}
            </span>
          </p>
        )}
      </Link>
    </li>
  );
}

export default function Catalog({ tests }: { tests: TestSummary[] }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  // На узких экранах категории сворачиваются: по умолчанию открыта только первая
  const [wide, setWide] = useState(false);
  const [opened, setOpened] = useState<Set<string>>(() => new Set([CATEGORIES[0].id]));
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const toggle = (id: string) =>
    setOpened((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

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
    <div id="catalog" className="scroll-mt-24 space-y-12">
      <div className="space-y-4">
        <label htmlFor="search" className="sr-only">
          Поиск по тестам
        </label>
        <div className="relative">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            id="search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Найти тест: тревога, личность, самооценка…"
            className="min-h-[52px] w-full rounded-control border border-line-strong bg-surface pl-12 pr-4 text-base placeholder:text-muted focus:border-accent"
          />
        </div>
        <div role="group" aria-label="Категории" className="-mx-gutter flex gap-2 overflow-x-auto px-gutter pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <button
            type="button"
            aria-pressed={cat === 'all'}
            onClick={() => setCat('all')}
            className={`min-h-[44px] shrink-0 rounded-full border px-4 text-ui transition-colors ${
              cat === 'all' ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface hover:bg-accent-soft'
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
              className={`cat-${c.id} inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-3.5 text-ui transition-colors ${
                cat === c.id ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface hover:bg-accent-soft'
              }`}
            >
              <span className={cat === c.id ? '' : 'cat-bubble inline-flex h-6 w-6 items-center justify-center rounded-full'}>
                <CategoryIcon id={c.id} className="h-4 w-4" />
              </span>
              {c.title} <span className="text-xs opacity-75">{counts[c.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {!filtering && popular.length > 0 && (
        <section aria-labelledby="popular" className="space-y-6">
          <h2 id="popular" className="t-h2">
            Популярные
          </h2>
          <ul className="-mx-gutter flex snap-x snap-mandatory gap-3 overflow-x-auto px-gutter pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 2xl:grid-cols-4">
            {popular.map((t) => (
              <TestCard key={t.id} t={t} itemClass="w-[17rem] shrink-0 snap-start sm:w-auto" />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="all" className="space-y-10">
        <h2 id="all" className="t-h2">
          {filtering ? 'Найдено' : 'Все тесты'}{' '}
          <span className="font-sans text-base font-normal text-muted" aria-live="polite">
            ({available.length})
          </span>
        </h2>
        {grouped.length ? (
          grouped.map(({ c, items }) => {
            const open = wide || filtering || opened.has(c.id);
            const head = (
              <>
                <span className="cat-bubble inline-flex h-8 w-8 items-center justify-center rounded-control">
                  <CategoryIcon id={c.id} className="h-5 w-5" />
                </span>
                {c.title}
              </>
            );
            return (
              <div key={c.id} className={`cat-${c.id} space-y-4`}>
                <h3 className="text-lg font-semibold">
                  {wide || filtering ? (
                    <span className="flex items-center gap-3">{head}</span>
                  ) : (
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`group-${c.id}`}
                      onClick={() => toggle(c.id)}
                      className="flex min-h-[44px] w-full items-center gap-3 text-left"
                    >
                      {head}
                      <span className="ml-auto text-meta font-normal text-muted">{items.length}</span>
                      <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  )}
                </h3>
                <ul id={`group-${c.id}`} className={open ? GRID : "hidden"}>
                  {items.map((t) => (
                    <TestCard key={t.id} t={t} />
                  ))}
                </ul>
              </div>
            );
          })
        ) : references.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 py-10 text-center">
            <p className="font-medium">Ничего не нашлось</p>
            <p className="max-w-[44ch] text-muted">Попробуйте другой запрос или выберите категорию «Все».</p>
          </div>
        ) : null}
      </section>

      {references.length > 0 && (
        <section aria-labelledby="refs" className="space-y-5">
          <div className="space-y-2">
            <h2 id="refs" className="t-h2">
              Известные методики: ссылки и открытые аналоги{' '}
              <span className="font-sans text-base font-normal text-muted">({references.length})</span>
            </h2>
            <p className="max-w-2xl text-ui text-muted">
              Эти методики защищены лицензией, поэтому вопросов здесь нет. В карточке есть официальный источник и открытые
              тесты на сайте, которые можно пройти вместо них.
            </p>
          </div>
          <ul className={GRID}>
            {references.map((t) => (
              <TestCard key={t.id} t={t} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
