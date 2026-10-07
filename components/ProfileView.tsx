'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import CategoryIcon from '@/components/CategoryIcon';
import { RadarChart } from '@/components/Charts';
import IntegratedView from '@/components/IntegratedView';
import { CharacteristicsTable, ConstructTable, MatrixTable } from '@/components/ProfileTables';
import RoseChart from '@/components/RoseChart';
import { CATEGORIES } from '@/lib/categories';
import { formatValue } from '@/lib/engine';
import { downloadProfilePng } from '@/lib/exportProfile';
import { formatDate } from '@/lib/format';
import { buildIntegrated, domainOf, uncovered } from '@/lib/integrate';
import { buildCharacteristics, chartLabels, type Characteristic } from '@/lib/profile';
import { loadHistory, loadProfileOverrides, saveProfileOverrides, type ProfileOverrides } from '@/lib/storage';
import type { ScaleResult, TestDef } from '@/lib/types';

const MIN_RADAR = 3;
const MAX_RADAR = 16;

export default function ProfileView({ tests }: { tests: TestDef[] }) {
  const [chars, setChars] = useState<Characteristic[] | null>(null);
  const [over, setOver] = useState<ProfileOverrides>({});
  const [view, setView] = useState<'radar' | 'map' | 'bars'>('map');
  const [tab, setTab] = useState<'whole' | 'tables' | 'charts'>('whole');

  useEffect(() => {
    setChars(buildCharacteristics(tests, loadHistory()));
    setOver(loadProfileOverrides());
  }, [tests]);

  const isOn = (c: Characteristic) => over[c.key] ?? !c.isClinical;
  const update = (next: ProfileOverrides) => {
    setOver(next);
    saveProfileOverrides(next);
  };
  const setMany = (pred: (c: Characteristic) => boolean) => {
    const next: ProfileOverrides = {};
    for (const c of chars ?? []) next[c.key] = pred(c);
    update(next);
  };

  const selected = useMemo(() => (chars ?? []).filter(isOn), [chars, over]); // eslint-disable-line react-hooks/exhaustive-deps
  const labels = useMemo(() => chartLabels(selected), [selected]);
  const testTitles = useMemo(() => Object.fromEntries(tests.map((t) => [t.id, t.title])), [tests]);
  const integrated = useMemo(() => buildIntegrated(selected), [selected]);
  const uncoveredChars = useMemo(() => uncovered(selected), [selected]);

  if (chars === null) return <p className="text-muted" role="status">Загрузка…</p>;

  if (!chars.length) {
    return (
      <div className="card flex flex-col items-center gap-4 py-12 text-center">
        <svg viewBox="0 0 120 120" className="h-28 w-28" fill="none" aria-hidden="true" focusable="false">
          <circle cx="60" cy="60" r="44" className="fill-accent-soft" />
          <polygon points="60,26 90,48 80,84 40,84 30,48" className="stroke-accent" strokeWidth="3" strokeLinejoin="round" strokeDasharray="6 6" />
          <circle cx="60" cy="60" r="5" className="fill-accent" />
        </svg>
        <h2 className="text-xl font-semibold">Профиль пока пуст</h2>
        <p className="max-w-md text-muted">
          Пройдите хотя бы один тест — его шкалы появятся здесь. Чем больше тестов вы пройдёте, тем полнее
          будет диаграмма. Всё хранится только в вашем браузере.
        </p>
        <Link href="/" className="btn btn-primary">
          Выбрать тест
        </Link>
      </div>
    );
  }

  const radarOk = selected.length >= MIN_RADAR && selected.length <= MAX_RADAR;
  const effectiveView: 'radar' | 'map' | 'bars' = view === 'radar' && !radarOk ? (selected.length > MAX_RADAR ? 'map' : 'bars') : view;
  const radarScales = selected.map((c, i) => ({ id: c.key, title: labels[i], percent: c.percent }) as unknown as ScaleResult);
  const lastDate = chars.reduce((m, c) => (c.date > m ? c.date : m), '');

  const groups = CATEGORIES.map((cat) => ({
    cat,
    all: chars.filter((c) => c.category === cat.id),
    chosen: selected.filter((c) => c.category === cat.id),
  })).filter((g) => g.all.length);

  const roseItems = groups.flatMap((g) =>
    g.chosen.map((c) => ({
      label: labels[selected.indexOf(c)],
      percent: c.percent,
      category: c.category,
      value: c.value,
      max: c.max,
      source: c.short,
    })),
  );

  const exportPng = () =>
    downloadProfilePng(
      (effectiveView === 'map' ? roseItems.map((r) => ({ label: r.label, sub: r.source, percent: r.percent, value: r.value, max: r.max, category: r.category })) : selected.map((c, i) => ({ label: labels[i], sub: c.short, percent: c.percent, value: c.value, max: c.max, category: c.category }))),
      effectiveView,
      formatDate(new Date().toISOString()),
    );

  const exportIntegrated = () => {
    const rows = integrated.filter((i) => i.score !== null);
    downloadProfilePng(
      rows.map((i) => ({
        label: i.def.title.replace(/s*(.*)$/, ''),
        sub: '',
        percent: i.score!,
        value: Math.round(i.score!),
        max: 100,
        category: domainOf(i.def.domain).category,
      })),
      rows.length >= 3 ? 'radar' : 'bars',
      formatDate(new Date().toISOString()),
    );
  };

  const TABS = [
    { id: 'whole', label: 'Целостная картина' },
    { id: 'tables', label: 'Сводные таблицы' },
    { id: 'charts', label: 'Диаграммы' },
  ] as const;

  return (
    <div className="space-y-10">
      <p className="rounded-xl2 bg-accent-soft p-4 text-[15px]">
        Профиль строится из <strong>последнего прохождения каждого теста</strong>. Значения — положение на шкале
        теста (0–100 %), а не норма. Шкалы разных тестов, которые измеряют одно и то же, объединяются в сводные
        показатели. Тест не является диагнозом. Для оценки состояния обратитесь к специалисту.
      </p>

      <div role="tablist" aria-label="Разделы профиля" className="flex flex-wrap gap-2 print:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`min-h-[44px] rounded-full border px-5 text-[15px] font-medium transition-colors ${
              tab === t.id ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-surface hover:bg-accent-soft'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <div id="panel-whole" role="tabpanel" aria-labelledby="tab-whole" hidden={tab !== 'whole'} className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Целостная картина ({selected.length} шкал → {integrated.filter((i) => i.score !== null).length} показателей)</h2>
              <div className="flex gap-2 print:hidden">
                <button type="button" className="btn btn-primary !min-h-[40px] !px-4 text-sm disabled:opacity-40" disabled={!integrated.some((i) => i.score !== null)} onClick={exportIntegrated}>
                  Скачать PNG
                </button>
                <button type="button" className="btn btn-ghost !min-h-[40px] !px-4 text-sm" onClick={() => window.print()}>
                  Скачать PDF
                </button>
              </div>
            </div>
            <IntegratedView items={integrated} uncoveredChars={uncoveredChars} testTitles={testTitles} />
          </div>

          <div id="panel-tables" role="tabpanel" aria-labelledby="tab-tables" hidden={tab !== 'tables'} className="space-y-10">
            <h2 className="text-xl font-semibold">Сводные таблицы</h2>
            <ConstructTable items={integrated} testTitles={testTitles} />
            <MatrixTable items={integrated} testTitles={testTitles} />
            <CharacteristicsTable chars={selected} />
            <p className="text-sm text-muted">Последнее прохождение: {formatDate(lastDate)}.</p>
          </div>

          <div id="panel-charts" role="tabpanel" aria-labelledby="tab-charts" hidden={tab !== 'charts'}>
        <section aria-labelledby="chart-title" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="chart-title" className="text-xl font-semibold">
              Диаграмма ({selected.length})
            </h2>
            <div role="group" aria-label="Вид диаграммы" className="inline-flex overflow-hidden rounded-full border border-line">
              {(['map', 'radar', 'bars'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`min-h-[40px] px-4 text-sm ${view === v ? 'bg-accent text-accent-fg' : 'bg-surface hover:bg-accent-soft'}`}
                >
                  {v === 'radar' ? 'Радар' : v === 'map' ? 'Круг' : 'Полосы'}
                </button>
              ))}
            </div>
          </div>

          {view === 'radar' && !radarOk && (
            <p role="status" className="rounded-xl bg-warm-soft p-3 text-sm">
              {selected.length < MIN_RADAR
                ? `Для радара выберите минимум ${MIN_RADAR} характеристики (сейчас ${selected.length}). Пока показаны полосы.`
                : `Для радара слишком много осей (${selected.length}, максимум ${MAX_RADAR}). Пока показана круговая карта: уберите лишнее, чтобы вернуться к радару.`}
            </p>
          )}

          {selected.length === 0 ? (
            <p className="card text-muted">Отметьте характеристики справа, чтобы построить диаграмму.</p>
          ) : effectiveView === 'map' ? (
            <div className="card space-y-2">
              <RoseChart items={roseItems} />
              <p className="text-center text-sm text-muted">
                Лепесток — одна характеристика; чем он длиннее, тем выше положение на шкале теста. Цвет — категория;
                подробности при наведении и в таблице ниже.
              </p>
            </div>
          ) : effectiveView === 'radar' ? (
            <div className="card">
              <RadarChart scales={radarScales} />
            </div>
          ) : (
            <div className="space-y-5">
              {groups
                .filter((g) => g.chosen.length)
                .map((g) => (
                  <div key={g.cat.id} className={`cat-${g.cat.id} card space-y-3`}>
                    <h3 className="flex items-center gap-2 font-semibold">
                      <span className="cat-bubble inline-flex h-8 w-8 items-center justify-center rounded-lg">
                        <CategoryIcon id={g.cat.id} className="h-5 w-5" />
                      </span>
                      {g.cat.title}
                    </h3>
                    <ul className="space-y-3">
                      {g.chosen.map((c) => (
                        <li key={c.key}>
                          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                            <span className="font-medium">
                              {c.title} <span className="font-normal text-muted">· {c.short}</span>
                            </span>
                            <span className="tabular-nums text-muted">
                              {formatValue(c.value)} <span aria-hidden="true">/</span>
                              <span className="sr-only"> из </span> {formatValue(c.max)}
                            </span>
                          </div>
                          <div
                            role="meter"
                            aria-label={`${c.title} (${c.short})`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(c.percent)}
                            className="h-3 overflow-hidden rounded-full bg-[rgb(var(--cat)/0.16)]"
                          >
                            <div className="h-full rounded-full bg-[rgb(var(--cat))]" style={{ width: `${Math.max(2, c.percent)}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 print:hidden">
            <button type="button" className="btn btn-primary disabled:opacity-40" disabled={!selected.length} onClick={exportPng}>
              Скачать PNG
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
              Скачать PDF
            </button>
          </div>
        </section>
          </div>
        </div>

        <section aria-labelledby="pick-title" className="space-y-4 print:hidden lg:sticky lg:top-4 lg:self-start">
          <h2 id="pick-title" className="text-xl font-semibold">
            Что показывать
          </h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost !min-h-[40px] !px-4 text-sm" onClick={() => setMany((c) => !c.isClinical)}>
              Все, кроме скринингов
            </button>
            <button type="button" className="btn btn-ghost !min-h-[40px] !px-4 text-sm" onClick={() => setMany(() => true)}>
              Выбрать всё
            </button>
            <button type="button" className="btn btn-ghost !min-h-[40px] !px-4 text-sm" onClick={() => setMany((c) => c.category === 'personality')}>
              Только личность
            </button>
            <button type="button" className="btn btn-ghost !min-h-[40px] !px-4 text-sm" onClick={() => setMany(() => false)}>
              Сбросить
            </button>
          </div>
          <p className="text-sm text-muted">
            Скрининги (тревога, депрессия, стресс и т. п.) по умолчанию не включены: добавьте их, если хотите
            видеть их рядом с остальным.
          </p>

          {groups.map((g) => (
            <details key={g.cat.id} open className={`cat-${g.cat.id} rounded-xl2 border border-line bg-surface`}>
              <summary className="flex cursor-pointer items-center gap-3 p-3 font-semibold">
                <span className="cat-bubble inline-flex h-8 w-8 items-center justify-center rounded-lg">
                  <CategoryIcon id={g.cat.id} className="h-5 w-5" />
                </span>
                {g.cat.title}
                <span className="ml-auto text-sm font-normal text-muted">
                  {g.chosen.length} из {g.all.length}
                </span>
              </summary>
              <ul className="space-y-1 border-t border-line p-3">
                {g.all.map((c) => (
                  <li key={c.key}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-accent-soft">
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--accent))]"
                        checked={isOn(c)}
                        onChange={(e) => update({ ...over, [c.key]: e.target.checked })}
                      />
                      <span className="text-[15px]">
                        <span className="font-medium">{c.title}</span>
                        <span className="block text-sm text-muted">
                          {c.short} · {formatValue(c.value)} из {formatValue(c.max)}
                          {c.rangeTitle ? ` · ${c.rangeTitle}` : ''}
                          {c.isClinical ? ' · скрининг' : ''}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}
