'use client';
import { Fragment, useMemo, useState } from 'react';
import { categoryTitle } from '@/lib/categories';
import { formatValue } from '@/lib/engine';
import { formatDate } from '@/lib/format';
import { DOMAINS, domainOf, type DomainId, type Integrated } from '@/lib/integrate';
import type { Characteristic } from '@/lib/profile';

const LEVEL_LABEL: Record<DomainId, [string, string, string]> = {
  personality: ['Низкий уровень', 'Средний уровень', 'Высокий уровень'],
  emotional: ['Слабо выражено', 'Умеренно', 'Выражено'],
  resources: ['Низкие', 'Средние', 'Высокие'],
};
const levelLabel = (i: Integrated) => (i.level ? LEVEL_LABEL[i.def.domain][['low', 'mid', 'high'].indexOf(i.level)] : '—');

const CONSISTENCY: Record<string, { text: string; hint: string; cls: string }> = {
  none: { text: 'Нет данных', hint: '', cls: 'text-muted' },
  single: { text: 'Один тест', hint: 'Показатель основан на одном тесте.', cls: 'text-muted' },
  consistent: { text: 'Согласуются', hint: 'Тесты дают близкие результаты.', cls: 'text-ink' },
  mixed: { text: 'Умеренный разброс', hint: 'Тесты немного расходятся.', cls: 'text-ink' },
  divergent: { text: 'Тесты расходятся', hint: 'Сильный разброс между тестами.', cls: 'text-warm' },
};

const CONFIDENCE: Record<string, { n: number; text: string }> = {
  none: { n: 0, text: 'нет' },
  low: { n: 1, text: 'низкая' },
  medium: { n: 2, text: 'средняя' },
  high: { n: 3, text: 'высокая' },
};

function ScoreBar({ i }: { i: Integrated }) {
  if (i.score === null) return null;
  return (
    <div
      role="img"
      aria-label={`Итог ${Math.round(i.score)} %, разброс по тестам от ${Math.round(i.min!)} до ${Math.round(i.max!)} %`}
      className={`cat-${domainOf(i.def.domain).category} relative h-4 w-full min-w-[140px] rounded-full bg-[rgb(var(--cat)/0.12)]`}
    >
      {i.sources.length > 1 && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[rgb(var(--cat)/0.35)]"
          style={{ left: `${i.min}%`, width: `${Math.max(1, i.max! - i.min!)}%` }}
        />
      )}
      {i.sources.map((s) => (
        <span
          key={s.char.key}
          aria-hidden="true"
          className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-surface bg-[rgb(var(--cat))] opacity-70"
          style={{ left: `${s.oriented}%` }}
        />
      ))}
      <span
        aria-hidden="true"
        className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
        style={{ left: `${i.score}%` }}
      />
    </div>
  );
}

export function ConstructTable({ items, testTitles }: { items: Integrated[]; testTitles: Record<string, string> }) {
  const [domain, setDomain] = useState<'all' | DomainId>('all');
  const [multiOnly, setMultiOnly] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [sort, setSort] = useState<'domain' | 'score' | 'spread'>('domain');
  const [open, setOpen] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    let r = items.filter((i) => (showEmpty || i.score !== null) && (domain === 'all' || i.def.domain === domain));
    if (multiOnly) r = r.filter((i) => new Set(i.sources.map((s) => s.char.testId)).size >= 2);
    if (sort === 'score') r = [...r].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    if (sort === 'spread') r = [...r].sort((a, b) => b.spread - a.spread);
    return r;
  }, [items, domain, multiOnly, showEmpty, sort]);

  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <section aria-labelledby="ct-title" className="space-y-3">
      <h3 id="ct-title" className="text-lg font-semibold">
        Сводные показатели
      </h3>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div role="group" aria-label="Область" className="inline-flex overflow-hidden rounded-full border border-line">
          {[{ id: 'all', title: 'Все' }, ...DOMAINS].map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={domain === d.id}
              onClick={() => setDomain(d.id as 'all' | DomainId)}
              className={`min-h-[40px] px-3 ${domain === d.id ? 'bg-accent text-accent-fg' : 'bg-surface hover:bg-accent-soft'}`}
            >
              {d.title}
            </button>
          ))}
        </div>
        <label className="flex min-h-[40px] items-center gap-2">
          Сортировка
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-lg border border-line bg-surface px-2 py-1">
            <option value="domain">По областям</option>
            <option value="score">По итогу (убывание)</option>
            <option value="spread">По разбросу (убывание)</option>
          </select>
        </label>
        <label className="flex min-h-[40px] items-center gap-2">
          <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--accent))]" checked={multiOnly} onChange={(e) => setMultiOnly(e.target.checked)} />
          Только из 2+ тестов
        </label>
        <label className="flex min-h-[40px] items-center gap-2">
          <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--accent))]" checked={showEmpty} onChange={(e) => setShowEmpty(e.target.checked)} />
          Показывать без данных
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-line bg-surface">
        <table className="w-full min-w-[820px] text-left text-sm">
          <caption className="sr-only">
            Сводные показатели: итог по всем тестам, разброс между тестами, источники, согласованность и уверенность
          </caption>
          <thead className="border-b border-line text-muted">
            <tr>
              <th scope="col" className="p-3 font-medium">Характеристика</th>
              <th scope="col" className="p-3 font-medium">Итог и разброс</th>
              <th scope="col" className="p-3 font-medium">Источники</th>
              <th scope="col" className="p-3 font-medium">Согласованность</th>
              <th scope="col" className="p-3 font-medium">Уверенность</th>
              <th scope="col" className="p-3 font-medium"><span className="sr-only">Подробнее</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-muted">Нет показателей по выбранным условиям.</td>
              </tr>
            )}
            {rows.map((i) => {
              const dom = domainOf(i.def.domain);
              const isOpen = open.has(i.def.id);
              const c = CONSISTENCY[i.consistency];
              const conf = CONFIDENCE[i.confidence];
              return (
                <Fragment key={i.def.id}>
                  <tr className={`cat-${dom.category} border-b border-line align-top ${i.score === null ? 'text-muted' : ''}`}>
                    <th scope="row" className="p-3 font-medium">
                      <span className="mb-1 inline-block rounded-full bg-[rgb(var(--cat)/0.18)] px-2 py-0.5 text-xs font-medium text-ink">{dom.title}</span>
                      <br />
                      {i.def.title}
                    </th>
                    <td className="p-3">
                      {i.score === null ? (
                        <span className="text-muted">нет данных</span>
                      ) : (
                        <div className="space-y-1.5">
                          <p>
                            <span className="text-lg font-semibold tabular-nums">{Math.round(i.score)} %</span>{' '}
                            <span className="text-muted">· {levelLabel(i)}</span>
                          </p>
                          <ScoreBar i={i} />
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <ul className="flex flex-wrap gap-1.5">
                        {i.sources.map((s) => (
                          <li
                            key={s.char.key}
                            title={`${s.char.testTitle}: ${s.char.title} — ${formatValue(s.char.value)} из ${formatValue(s.char.max)}${s.invert ? ' (шкала перевёрнута)' : ''}${s.weight < 1 ? ' (родственная шкала, вес ' + s.weight + ')' : ''}`}
                            className="rounded-full border border-line px-2 py-0.5 text-xs"
                          >
                            {s.char.short} {Math.round(s.oriented)} %{s.invert ? ' ↺' : ''}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className={`p-3 ${c.cls}`}>
                      <span className="font-medium">{c.text}</span>
                      {i.consistency !== 'none' && i.consistency !== 'single' && <span className="block text-xs text-muted">разброс {Math.round(i.spread)} п. п.</span>}
                    </td>
                    <td className="p-3">
                      <span aria-hidden="true" className="tracking-widest">{'●'.repeat(conf.n)}{'○'.repeat(3 - conf.n)}</span>
                      <span className="block text-xs text-muted">{conf.text}</span>
                    </td>
                    <td className="p-3 text-right">
                      {i.score !== null && (
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => toggle(i.def.id)}
                          className="min-h-[36px] rounded-full border border-line px-3 hover:bg-accent-soft"
                        >
                          {isOpen ? 'Скрыть' : 'Подробнее'}
                          <span className="sr-only"> про {i.def.title}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-line bg-accent-soft/50">
                      <td colSpan={6} className="p-4">
                        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
                          <dl className="space-y-2">
                            <div>
                              <dt className="font-medium">Низкий итог</dt>
                              <dd className="text-muted">{i.def.low}</dd>
                            </div>
                            <div>
                              <dt className="font-medium">Высокий итог</dt>
                              <dd className="text-muted">{i.def.high}</dd>
                            </div>
                          </dl>
                          <table className="w-full text-xs">
                            <thead className="text-muted">
                              <tr>
                                <th scope="col" className="py-1 text-left font-medium">Тест и шкала</th>
                                <th scope="col" className="py-1 text-right font-medium">Балл</th>
                                <th scope="col" className="py-1 text-right font-medium">В сводке</th>
                                <th scope="col" className="py-1 text-right font-medium">Вес</th>
                                <th scope="col" className="py-1 text-right font-medium">Дата</th>
                              </tr>
                            </thead>
                            <tbody>
                              {i.sources.map((s) => (
                                <tr key={s.char.key} className="border-t border-line">
                                  <th scope="row" className="py-1 text-left font-normal">
                                    {testTitles[s.char.testId] ?? s.char.short}: {s.char.title}
                                    {s.invert ? ' (перевёрнута)' : ''}
                                  </th>
                                  <td className="py-1 text-right tabular-nums">{formatValue(s.char.value)} / {formatValue(s.char.max)}</td>
                                  <td className="py-1 text-right tabular-nums">{Math.round(s.oriented)} %</td>
                                  <td className="py-1 text-right tabular-nums">{s.weight}</td>
                                  <td className="py-1 text-right">{formatDate(s.char.date)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Итог — взвешенное среднее положений на шкалах. Тёмная метка на полосе — итог, светлые точки — отдельные
        тесты, полоса за ними — диапазон. ↺ — шкала перевёрнута (например, нейротизм → устойчивость). Вес 1 —
        прямое соответствие, меньше 1 — родственная шкала.
      </p>
    </section>
  );
}

export function MatrixTable({ items, testTitles }: { items: Integrated[]; testTitles: Record<string, string> }) {
  const rows = items.filter((i) => i.score !== null);
  const tests: string[] = [];
  for (const r of rows) for (const s of r.sources) if (!tests.includes(s.char.testId)) tests.push(s.char.testId);
  if (!rows.length) return null;
  const short = (id: string) => rows.flatMap((r) => r.sources).find((s) => s.char.testId === id)?.char.short ?? id;

  return (
    <section aria-labelledby="mx-title" className="space-y-3">
      <h3 id="mx-title" className="text-lg font-semibold">
        Матрица «тест × характеристика»
      </h3>
      <div className="overflow-x-auto rounded-xl2 border border-line bg-surface">
        <table className="w-full min-w-[640px] border-collapse text-center text-xs">
          <caption className="sr-only">
            Положение на шкале (в процентах) по каждой характеристике в каждом пройденном тесте, с учётом направления шкалы
          </caption>
          <thead className="text-muted">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-surface p-2 text-left font-medium">Характеристика</th>
              {tests.map((t) => (
                <th key={t} scope="col" className="p-2 font-medium" title={testTitles[t]}>{short(t)}</th>
              ))}
              <th scope="col" className="p-2 font-semibold text-ink">Итог</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const cat = domainOf(r.def.domain).category;
              return (
                <tr key={r.def.id} className={`cat-${cat} border-t border-line`}>
                  <th scope="row" className="sticky left-0 z-10 bg-surface p-2 text-left font-medium">{r.def.title}</th>
                  {tests.map((t) => {
                    const ss = r.sources.filter((s) => s.char.testId === t);
                    if (!ss.length) return <td key={t} className="p-2 text-muted"><span aria-label="нет данных">—</span></td>;
                    const w = ss.reduce((a, s) => a + s.weight, 0);
                    const v = ss.reduce((a, s) => a + s.oriented * s.weight, 0) / w;
                    return (
                      <td
                        key={t}
                        title={ss.map((s) => `${s.char.title}: ${formatValue(s.char.value)} из ${formatValue(s.char.max)}`).join('; ')}
                        className="p-2 tabular-nums text-ink"
                        style={{ background: `rgb(var(--cat) / ${(0.08 + (v / 100) * 0.3).toFixed(2)})` }}
                      >
                        {Math.round(v)}
                        {ss.some((s) => s.invert) ? '↺' : ''}
                      </td>
                    );
                  })}
                  <td className="p-2 font-semibold tabular-nums" style={{ background: `rgb(var(--cat) / ${(0.12 + (r.score! / 100) * 0.3).toFixed(2)})` }}>
                    {Math.round(r.score!)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Чем насыщеннее клетка, тем выше положение на шкале. Пустые клетки — тест не пройден или не измеряет эту характеристику.</p>
    </section>
  );
}

type SortKey = 'title' | 'category' | 'test' | 'percent' | 'date';

export function CharacteristicsTable({ chars }: { chars: Characteristic[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'category', dir: 'asc' });
  const rows = useMemo(() => {
    const val = (c: Characteristic): string | number =>
      sort.key === 'title' ? c.title : sort.key === 'category' ? categoryTitle(c.category) : sort.key === 'test' ? c.short : sort.key === 'percent' ? c.percent : c.date;
    return [...chars].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'ru');
      return sort.dir === 'asc' ? r : -r;
    });
  }, [chars, sort]);

  const head = (key: SortKey, label: string, right = false) => (
    <th
      scope="col"
      aria-sort={sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`p-3 font-medium ${right ? 'text-right' : ''}`}
    >
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))}
        className="inline-flex items-center gap-1 rounded hover:text-ink"
      >
        {label}
        <span aria-hidden="true">{sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  );

  return (
    <section aria-labelledby="all-title" className="space-y-3">
      <h3 id="all-title" className="text-lg font-semibold">
        Все выбранные характеристики
      </h3>
      <div className="overflow-x-auto rounded-xl2 border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Все выбранные характеристики с возможностью сортировки по столбцам</caption>
          <thead className="border-b border-line text-muted">
            <tr>
              {head('title', 'Характеристика')}
              {head('category', 'Категория')}
              {head('test', 'Тест')}
              {head('percent', 'Положение', true)}
              <th scope="col" className="p-3 text-right font-medium">Балл</th>
              <th scope="col" className="p-3 font-medium">Вывод теста</th>
              {head('date', 'Дата')}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.key} className={`cat-${c.category} border-b border-line last:border-0`}>
                <th scope="row" className="p-3 font-medium">{c.title}</th>
                <td className="p-3">{categoryTitle(c.category)}</td>
                <td className="p-3">{c.short}{c.isClinical ? ' · скрининг' : ''}</td>
                <td className="p-3 text-right tabular-nums">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className="inline-block h-2 w-16 overflow-hidden rounded-full bg-[rgb(var(--cat)/0.16)]">
                      <span className="block h-full rounded-full bg-[rgb(var(--cat))]" style={{ width: `${Math.max(3, c.percent)}%` }} />
                    </span>
                    {Math.round(c.percent)} %
                  </span>
                </td>
                <td className="p-3 text-right tabular-nums">{formatValue(c.value)} / {formatValue(c.max)}</td>
                <td className="p-3">{c.rangeTitle ?? '—'}</td>
                <td className="p-3 whitespace-nowrap">{formatDate(c.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
