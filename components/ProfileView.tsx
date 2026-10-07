'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import CategoryIcon from '@/components/CategoryIcon';
import { RadarChart } from '@/components/Charts';
import RoseChart from '@/components/RoseChart';
import { CATEGORIES } from '@/lib/categories';
import { formatValue } from '@/lib/engine';
import { downloadProfilePng } from '@/lib/exportProfile';
import { formatDate } from '@/lib/format';
import { buildCharacteristics, chartLabels, type Characteristic } from '@/lib/profile';
import { loadHistory, loadProfileOverrides, saveProfileOverrides, type ProfileOverrides } from '@/lib/storage';
import type { ScaleResult, TestDef } from '@/lib/types';

const MIN_RADAR = 3;
const MAX_RADAR = 16;

export default function ProfileView({ tests }: { tests: TestDef[] }) {
  const [chars, setChars] = useState<Characteristic[] | null>(null);
  const [over, setOver] = useState<ProfileOverrides>({});
  const [view, setView] = useState<'radar' | 'map' | 'bars'>('map');

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

  return (
    <div className="space-y-10">
      <p className="rounded-xl2 bg-accent-soft p-4 text-[15px]">
        Диаграмма строится из <strong>последнего прохождения каждого теста</strong>. Длина полосы или точка на
        радаре — положение на шкале конкретного теста (0–100 %), а не норма и не сравнение между тестами. Тест
        не является диагнозом. Для оценки состояния обратитесь к специалисту.
      </p>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <section aria-labelledby="chart-title" className="space-y-4 lg:sticky lg:top-4 lg:self-start">
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

        <section aria-labelledby="pick-title" className="space-y-4 print:hidden">
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

      <section aria-labelledby="table-title" className="space-y-3">
        <h2 id="table-title" className="text-xl font-semibold">
          Таблица характеристик
        </h2>
        <div className="overflow-x-auto rounded-xl2 border border-line bg-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="p-3 font-medium">Характеристика</th>
                <th scope="col" className="p-3 font-medium">Тест</th>
                <th scope="col" className="p-3 font-medium">Балл</th>
                <th scope="col" className="p-3 font-medium">Вывод теста</th>
              </tr>
            </thead>
            <tbody>
              {selected.map((c) => (
                <tr key={c.key} className="border-b border-line last:border-0">
                  <th scope="row" className="p-3 font-medium">{c.title}</th>
                  <td className="p-3">{c.short}</td>
                  <td className="p-3 tabular-nums">
                    {formatValue(c.value)} / {formatValue(c.max)}
                  </td>
                  <td className="p-3">{c.rangeTitle ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted">Последнее прохождение: {formatDate(lastDate)}.</p>
      </section>
    </div>
  );
}
