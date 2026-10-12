'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { autoBackup } from '@/lib/autoBackup';
import { formatValue } from '@/lib/engine';
import { formatDay, formatDayShort, signed } from '@/lib/format';
import { formatDuration } from '@/lib/quality';
import { addNote, deleteNote, loadNotes } from '@/lib/storage';
import {
  buildSeries,
  CHANGE_LABEL,
  classifyChange,
  compareItems,
  polarity,
  type ChangeKind,
  type TestSeries,
} from '@/lib/trends';
import type { HistoryEntry, Note, TestDef } from '@/lib/types';

const KIND_STYLE: Record<ChangeKind, string> = {
  better: 'bg-[rgb(var(--c-neurodiversity)/0.22)]',
  worse: 'bg-warm-soft',
  stable: 'border border-line',
  changed: 'bg-accent-soft',
};
const KIND_MARK: Record<ChangeKind, string> = { better: '↗', worse: '↘', stable: '→', changed: '↔' };

function ChangeChip({ kind }: { kind: ChangeKind }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-ink ${KIND_STYLE[kind]}`}>
      <span aria-hidden="true">{KIND_MARK[kind]}</span>
      {CHANGE_LABEL[kind]}
    </span>
  );
}

interface ChartPoint {
  t: number;
  value: number;
  id: string;
}

function TrendChart({
  points,
  min,
  max,
  threshold,
  notes,
  label,
}: {
  points: ChartPoint[];
  min: number;
  max: number;
  threshold?: { value: number; label: string };
  notes: { t: number; n: number }[];
  label: string;
}) {
  const W = 640;
  const H = 260;
  const left = 48;
  const right = 18;
  const top = 22;
  const bottom = 38;
  const ts = points.map((p) => p.t);
  const span = Math.max(...ts) - Math.min(...ts);
  const pad = span ? span * 0.04 : 3 * 86_400_000;
  const t0 = Math.min(...ts) - pad;
  const t1 = Math.max(...ts) + pad;
  const x = (t: number) => left + ((t - t0) / (t1 - t0)) * (W - left - right);
  const y = (v: number) => top + (1 - (v - min) / (max === min ? 1 : max - min)) * (H - top - bottom);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const ticks = [min, (min + max) / 2, max];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={left} x2={W - right} y1={y(v)} y2={y(v)} className="stroke-line" strokeDasharray="3 5" />
          <text x={left - 8} y={y(v) + 4} textAnchor="end" className="fill-muted text-[11px]">
            {formatValue(v)}
          </text>
        </g>
      ))}
      {threshold && threshold.value >= min && threshold.value <= max && (
        <g>
          <line x1={left} x2={W - right} y1={y(threshold.value)} y2={y(threshold.value)} className="stroke-warm" strokeWidth={1.5} strokeDasharray="6 4" />
          <text x={W - right} y={y(threshold.value) - 6} textAnchor="end" className="fill-warm text-[11px] font-medium">
            {threshold.label}
          </text>
        </g>
      )}
      {notes
        .filter((n) => n.t >= t0 && n.t <= t1)
        .map((n) => (
          <g key={n.n}>
            <line x1={x(n.t)} x2={x(n.t)} y1={top - 4} y2={H - bottom} className="stroke-muted" strokeWidth={1} strokeDasharray="2 4" />
            <circle cx={x(n.t)} cy={top - 8} r={8} className="fill-surface stroke-muted" strokeWidth={1.2} />
            <text x={x(n.t)} y={top - 4.5} textAnchor="middle" className="fill-ink text-[10px] font-medium">
              {n.n}
            </text>
          </g>
        ))}
      <path d={path} fill="none" strokeWidth={2.5} strokeLinejoin="round" style={{ stroke: 'rgb(var(--cat) / 0.6)' }} />
      {points.map((p) => (
        <circle key={p.id} cx={x(p.t)} cy={y(p.value)} r={5} style={{ fill: 'rgb(var(--cat))' }} />
      ))}
      <text x={left} y={H - 10} textAnchor="start" className="fill-muted text-[11px]">
        {formatDayShort(Math.min(...ts))}
      </text>
      {span > 0 && (
        <text x={W - right} y={H - 10} textAnchor="end" className="fill-muted text-[11px]">
          {formatDayShort(Math.max(...ts))}
        </text>
      )}
    </svg>
  );
}

function ItemDiff({ test, a, b }: { test: TestDef; a: HistoryEntry; b: HistoryEntry }) {
  const rows = useMemo(
    () =>
      compareItems(test, a.answers, b.answers)
        .filter((r) => Math.abs(r.delta) > 0.5)
        .sort((p, q) => Math.abs(q.delta) - Math.abs(p.delta))
        .slice(0, 6),
    [test, a, b],
  );
  if (!rows.length) return <p className="text-[15px] text-muted">Ответы в этих двух прохождениях не отличаются.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const pol = polarity(test.id, r.scaleId);
        const kind: ChangeKind = pol === 'neutral' ? 'changed' : (pol === 'down' ? r.delta < 0 : r.delta > 0) ? 'better' : 'worse';
        return (
          <li key={r.id} className="rounded-xl border border-line p-3">
            <p className="text-[15px]">
              <span className="font-medium">Пункт {r.index}.</span> {r.text}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>
                {r.beforeLabel} <span aria-hidden="true">→</span>
                <span className="sr-only"> сменилось на </span> {r.afterLabel}
              </span>
              <ChangeChip kind={kind} />
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function Notes({ notes, onChange }: { notes: Note[]; onChange: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [text, setText] = useState('');
  return (
    <section aria-labelledby="notes-title" className="card space-y-4">
      <div>
        <h3 id="notes-title" className="font-semibold">
          Заметки о событиях
        </h3>
        <p className="mt-1 text-sm text-muted">
          Отметьте, например, «начал терапию» или «сложный период на работе»: заметки появятся на графиках и в отчёте и
          помогут понять причины перемен. Хранятся только в этом браузере.
        </p>
      </div>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          addNote(date, text);
          void autoBackup();
          setText('');
          onChange();
        }}
      >
        <label className="space-y-1 text-sm">
          <span className="block text-muted">Дата</span>
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} className="min-h-[44px] rounded-xl border border-line bg-surface px-3" />
        </label>
        <label className="min-w-[14rem] flex-1 space-y-1 text-sm">
          <span className="block text-muted">Что произошло</span>
          <input type="text" value={text} maxLength={300} onChange={(e) => setText(e.target.value)} className="min-h-[44px] w-full rounded-xl border border-line bg-surface px-3" />
        </label>
        <button type="submit" className="btn btn-ghost" disabled={!text.trim()}>
          Добавить
        </button>
      </form>
      {notes.length > 0 && (
        <ol className="space-y-2">
          {notes.map((n, i) => (
            <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent-soft p-3 text-[15px]">
              <span>
                <span className="font-medium tabular-nums">{i + 1}. {formatDay(n.date)}</span> — {n.text}
              </span>
              <button
                type="button"
                className="text-sm underline underline-offset-4"
                aria-label={`Удалить заметку: ${n.text}`}
                onClick={() => {
                  deleteNote(n.id);
                  onChange();
                }}
              >
                Удалить
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function TrendView({ tests, history }: { tests: TestDef[]; history: HistoryEntry[] }) {
  const series = useMemo(() => buildSeries(tests, history), [tests, history]);
  const [testId, setTestId] = useState<string>('');
  const [scaleId, setScaleId] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [aIdx, setAIdx] = useState(0);
  const [bIdx, setBIdx] = useState(-1);

  useEffect(() => setNotes(loadNotes()), []);

  const current: TestSeries | undefined = series.find((s) => s.test.id === testId) ?? series[0];
  useEffect(() => {
    setAIdx(0);
    setBIdx(-1);
    setScaleId('');
  }, [current?.test.id]);

  if (!series.length) {
    return (
      <div className="card space-y-3 text-[15px]">
        <p>Пока нет результатов. Пройдите тест, а потом повторите его позже: так появится динамика.</p>
        <Link href="/" className="btn btn-primary">
          Выбрать тест
        </Link>
      </div>
    );
  }
  if (!current) return null;

  const test = current.test;
  const first = current.points[0];
  const scaleDefs = first.scales;
  const sid = scaleDefs.some((s) => s.id === scaleId) ? scaleId : scaleDefs[0].id;
  const sdef = scaleDefs.find((s) => s.id === sid)!;
  const scaleTitle = (id: string, title: string) => (id === 'total' ? test.scoring.totalTitle ?? test.title : title);
  const rows = current.points.map((p) => ({ entry: p.entry, s: p.scales.find((x) => x.id === sid)! }));

  const rule = [test.safety?.helpAboveScore].flat().find((r) => r && r.scale === sid && (r.min !== undefined || r.max !== undefined));
  const threshold = rule
    ? { value: (rule.min ?? rule.max)!, label: rule.min !== undefined ? `порог скрининга: ${formatValue(rule.min)}` : `порог: ${formatValue(rule.max!)}` }
    : undefined;

  const chartNotes = notes.map((n, i) => ({ t: new Date(n.date + 'T12:00:00').getTime(), n: i + 1 }));
  const total = rows.length;
  const b = bIdx < 0 ? total - 1 : Math.min(bIdx, total - 1);
  const a = Math.min(aIdx, total - 1);
  const lastChange = total > 1 ? classifyChange(test.id, sdef, rows[total - 2].s.value, rows[total - 1].s.value) : null;
  const totalChange = total > 2 ? classifyChange(test.id, sdef, rows[0].s.value, rows[total - 1].s.value) : null;

  return (
    <div className="space-y-8">
      <p className="rounded-xl2 bg-accent-soft p-4 text-[15px]">
        Одно прохождение показывает состояние в конкретный момент, а повторные — динамику. Регулярное отслеживание результатов
        помогает замечать перемены раньше и обсуждать их со специалистом (Lambert и др., обратная связь в психотерапии).
        Изменение считается значимым, только если оно больше обычных колебаний, поэтому ниже указан порог.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block text-muted">Тест</span>
          <select
            value={test.id}
            onChange={(e) => setTestId(e.target.value)}
            className="min-h-[44px] rounded-xl border border-line bg-surface px-3 text-base"
          >
            {series.map((s) => (
              <option key={s.test.id} value={s.test.id}>
                {s.test.title} ({s.points.length})
              </option>
            ))}
          </select>
        </label>
        {scaleDefs.length > 1 && (
          <label className="space-y-1 text-sm">
            <span className="block text-muted">Шкала</span>
            <select value={sid} onChange={(e) => setScaleId(e.target.value)} className="min-h-[44px] rounded-xl border border-line bg-surface px-3 text-base">
              {scaleDefs.map((s) => (
                <option key={s.id} value={s.id}>
                  {scaleTitle(s.id, s.title)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <section aria-labelledby="trend-title" className={`cat-${test.category} card space-y-4`}>
        <h3 id="trend-title" className="font-semibold">
          {scaleTitle(sdef.id, sdef.title)}: {total} {total === 1 ? 'прохождение' : total < 5 ? 'прохождения' : 'прохождений'}
        </h3>
        <TrendChart
          points={rows.map((r) => ({ t: new Date(r.entry.completedAt).getTime(), value: r.s.value, id: r.entry.id }))}
          min={sdef.min}
          max={sdef.max}
          threshold={threshold}
          notes={chartNotes}
          label={`График результатов «${scaleTitle(sdef.id, sdef.title)}»: ${rows.map((r) => `${formatDay(r.entry.completedAt)} — ${formatValue(r.s.value)}`).join('; ')}. Подробности в таблице ниже.`}
        />
        {notes.length > 0 && <p className="text-sm text-muted">Цифры в кружках — заметки о событиях (список ниже).</p>}
        {total === 1 && <p className="text-[15px] text-muted">Пока одно прохождение. Пройдите тест ещё раз (не раньше, чем через период, о котором спрашивает тест), чтобы увидеть динамику.</p>}
        {lastChange && (
          <div className="space-y-2 rounded-xl bg-accent-soft p-4 text-[15px]">
            <p className="flex flex-wrap items-center gap-3">
              <ChangeChip kind={lastChange.kind} />
              <span>
                С прошлого раза: {formatValue(rows[total - 2].s.value)} → {formatValue(rows[total - 1].s.value)} ({signed(lastChange.delta)}).
                {lastChange.strong ? ' Достигнут порог клинически значимого изменения.' : ''}
              </span>
            </p>
            {totalChange && (
              <p className="text-muted">
                С самого первого раза ({formatDay(rows[0].entry.completedAt)}): {signed(totalChange.delta)} — {CHANGE_LABEL[totalChange.kind].toLowerCase()}.
              </p>
            )}
            <p className="text-sm text-muted">Порог значимого изменения: {formatValue(Math.round(lastChange.threshold.points * 100) / 100)}. {lastChange.threshold.basis}</p>
          </div>
        )}
      </section>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-[15px]">
          <caption className="sr-only">Результаты по датам</caption>
          <thead>
            <tr className="border-b border-line text-sm text-muted">
              <th scope="col" className="py-2 pr-3 font-medium">Дата</th>
              <th scope="col" className="py-2 pr-3 font-medium">Результат</th>
              <th scope="col" className="py-2 pr-3 font-medium">Уровень</th>
              <th scope="col" className="py-2 pr-3 font-medium">Изменение</th>
              <th scope="col" className="py-2 font-medium">Время</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const ch = i ? classifyChange(test.id, sdef, rows[i - 1].s.value, r.s.value) : null;
              return (
                <tr key={r.entry.id} className="border-b border-line align-top">
                  <td className="py-2 pr-3">
                    <Link href={`/tests/${test.id}/result?r=${r.entry.id}`} className="underline underline-offset-4">
                      {formatDay(r.entry.completedAt)}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{formatValue(r.s.value)} из {formatValue(r.s.max)}</td>
                  <td className="py-2 pr-3">{r.s.range?.title ?? '—'}</td>
                  <td className="py-2 pr-3">{ch ? <><ChangeChip kind={ch.kind} /> <span className="tabular-nums text-muted">{signed(ch.delta)}</span></> : '—'}</td>
                  <td className="py-2 tabular-nums text-muted">{r.entry.durationSec !== undefined ? formatDuration(r.entry.durationSec) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {total > 1 && (
        <section aria-labelledby="diff-title" className="card space-y-4">
          <h3 id="diff-title" className="font-semibold">Что изменилось в ответах</h3>
          <div className="flex flex-wrap items-end gap-4">
            {[
              { label: 'Прохождение «до»', val: a, set: setAIdx },
              { label: 'Прохождение «после»', val: b, set: setBIdx },
            ].map((x) => (
              <label key={x.label} className="space-y-1 text-sm">
                <span className="block text-muted">{x.label}</span>
                <select value={x.val} onChange={(e) => x.set(Number(e.target.value))} className="min-h-[44px] rounded-xl border border-line bg-surface px-3 text-base">
                  {rows.map((r, i) => (
                    <option key={r.entry.id} value={i}>
                      {formatDay(r.entry.completedAt)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="text-sm text-muted">Пункты, ответ на которые изменился сильнее всего (до шести):</p>
          <ItemDiff test={test} a={rows[a].entry} b={rows[b].entry} />
        </section>
      )}

      <Notes notes={notes} onChange={() => setNotes(loadNotes())} />
    </div>
  );
}
