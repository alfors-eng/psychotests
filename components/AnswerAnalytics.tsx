'use client';
import { useMemo, useState } from 'react';
import { analyzeAnswers, type ItemStat } from '@/lib/analytics';
import type { Answers, ScaleResult, TestDef } from '@/lib/types';

const BAR_LIMIT = 12; // до стольких пунктов в шкале показываем полосы с текстом, дальше — матрицу
const TOTAL_LIMIT = 30; // в длинных тестах (больше пунктов) всегда матрица, иначе страница слишком длинная

function Distribution({ bins }: { bins: ReturnType<typeof analyzeAnswers>['distribution'] }) {
  const max = Math.max(1, ...bins.map((b) => b.count));
  return (
    <ul className="space-y-2" aria-label="Сколько раз выбран каждый вариант ответа">
      {bins.map((b) => (
        <li key={b.value} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="text-sm">{b.label}</span>
          <span className="text-sm tabular-nums text-muted">
            {b.count} · {Math.round(b.percent)} %
          </span>
          <div aria-hidden="true" className="col-span-2 h-3 overflow-hidden rounded-full bg-[rgb(var(--cat)/0.14)]">
            <div className="anim-bar h-full rounded-full bg-[rgb(var(--cat))]" style={{ width: `${(b.count / max) * 100}%`, minWidth: b.count ? 6 : 0 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Sequence({ test, seq }: { test: TestDef; seq: { index: number; raw: number }[] }) {
  const opts = [...test.scale.options].sort((a, b) => a.value - b.value);
  const W = 640;
  const H = 200;
  const left = 34;
  const right = 12;
  const top = 14;
  const bottom = 30;
  const n = test.questions.length;
  const x = (i: number) => left + (n === 1 ? 0 : ((i - 1) / (n - 1)) * (W - left - right));
  const y = (v: number) => {
    const k = opts.findIndex((o) => o.value === v);
    return top + (1 - k / Math.max(1, opts.length - 1)) * (H - top - bottom);
  };
  const path = seq.map((p, i) => `${i ? 'L' : 'M'}${x(p.index).toFixed(1)} ${y(p.raw).toFixed(1)}`).join(' ');
  const step = Math.max(1, Math.ceil(n / 10));
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`График ответов по ходу теста: ${seq.length} пунктов, значения от ${opts[0].value} до ${opts[opts.length - 1].value}. Подробности — в списках ниже.`}
      className="h-auto w-full"
    >
      {opts.map((o) => (
        <g key={o.value}>
          <line x1={left} x2={W - right} y1={y(o.value)} y2={y(o.value)} className="stroke-line" strokeDasharray="3 5" />
          <text x={left - 8} y={y(o.value) + 4} textAnchor="end" className="fill-muted text-[11px]">
            {o.value}
          </text>
        </g>
      ))}
      <path d={path} fill="none" strokeWidth={2} strokeLinejoin="round" style={{ stroke: 'rgb(var(--cat) / 0.55)' }} />
      {seq.map((p) => (
        <circle key={p.index} cx={x(p.index)} cy={y(p.raw)} r={n > 40 ? 2.6 : 4} style={{ fill: 'rgb(var(--cat))' }} />
      ))}
      {Array.from({ length: n }, (_, i) => i + 1)
        .filter((i) => i === 1 || i === n || i % step === 0)
        .map((i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle" className="fill-muted text-[11px]">
            {i}
          </text>
        ))}
    </svg>
  );
}

function ItemBars({ items, sort }: { items: ItemStat[]; sort: 'order' | 'impact' }) {
  const list = [...items].sort((a, b) => (sort === 'impact' ? b.percent - a.percent || a.index - b.index : a.index - b.index));
  return (
    <ol className="space-y-3">
      {list.map((it) => (
        <li key={it.id} className={it.counted ? '' : 'opacity-60'}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span>
              <span className="tabular-nums text-muted">{it.index}.</span> {it.text}
              {it.reversed && <span className="text-muted"> (обратный)</span>}
              {!it.counted && <span className="text-muted"> (не входит в подсчёт)</span>}
            </span>
            <span className="shrink-0 tabular-nums text-muted">{Math.round(it.percent)} %</span>
          </div>
          <div
            role="meter"
            aria-label={`Пункт ${it.index}: вклад в шкалу`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(it.percent)}
            className="h-2.5 overflow-hidden rounded-full bg-[rgb(var(--cat)/0.14)]"
          >
            <div className="h-full rounded-full bg-[rgb(var(--cat))]" style={{ width: `${Math.max(2, it.percent)}%` }} />
          </div>
          <p className="mt-0.5 text-xs text-muted">Ваш ответ: {it.answerLabel}</p>
        </li>
      ))}
    </ol>
  );
}

function ItemMatrix({ items }: { items: ItemStat[] }) {
  return (
    <div>
      <ul className="flex flex-wrap gap-1" aria-label="Вклад каждого пункта: чем насыщеннее цвет, тем больше вклад">
        {items.map((it) => (
          <li
            key={it.id}
            title={`Пункт ${it.index}: ${it.answerLabel} — вклад ${Math.round(it.percent)} %`}
            aria-label={`Пункт ${it.index}: ${it.answerLabel}, вклад ${Math.round(it.percent)} %`}
            className="h-6 w-6 rounded-md border border-line"
            style={{ background: `rgb(var(--cat) / ${(0.08 + (it.percent / 100) * 0.82).toFixed(2)})` }}
          />
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">Каждая клетка — пункт по порядку. Бледная — малый вклад в шкалу, насыщенная — большой.</p>
    </div>
  );
}

export default function AnswerAnalytics({ test, answers, scales }: { test: TestDef; answers: Answers; scales: ScaleResult[] }) {
  const a = useMemo(() => analyzeAnswers(test, answers, scales), [test, answers, scales]);
  const [sort, setSort] = useState<'order' | 'impact'>('order');

  const groups = useMemo(() => {
    const m = new Map<string, ItemStat[]>();
    for (const it of a.items) m.set(it.scaleId, [...(m.get(it.scaleId) ?? []), it]);
    return [...m.entries()].map(([id, items]) => ({ id, title: items[0].scaleTitle, items }));
  }, [a.items]);

  if (!a.total) return null;

  return (
    <section aria-labelledby="analytics-title" className="space-y-6">
      <div className="space-y-1">
        <h2 id="analytics-title" className="text-xl font-semibold">
          Аналитика ваших ответов
        </h2>
        <p className="text-sm text-muted">
          Графики показывают, как вы отвечали, и помогают понять, откуда взялся итоговый балл. Они не оценивают
          вас, а только описывают ваши ответы.
        </p>
      </div>

      <ul className="space-y-2">
        {a.insights.map((t) => (
          <li key={t} className="flex gap-3 rounded-xl bg-accent-soft p-3 text-[15px]">
            <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[rgb(var(--cat))]" />
            {t}
          </li>
        ))}
      </ul>

      <div className="grid gap-4 sm:grid-cols-3" aria-label="Краткие показатели ответов">
        {[
          { k: 'Пунктов', v: String(a.total) },
          { k: 'Крайние варианты', v: `${Math.round(a.extremeShare * 100)} %` },
          { k: 'Нейтральные', v: a.neutralShare === null ? '—' : `${Math.round(a.neutralShare * 100)} %` },
        ].map((s) => (
          <div key={s.k} className="card p-4">
            <p className="text-sm text-muted">{s.k}</p>
            <p className="text-2xl font-semibold tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Распределение ответов</h3>
        <Distribution bins={a.distribution} />
      </div>

      {test.questions.length > 1 && (
        <div className="card space-y-3">
          <h3 className="font-semibold">Ответы по ходу теста</h3>
          <p className="text-sm text-muted">По горизонтали — номер пункта, по вертикали — выбранный вариант. Помогает увидеть закономерности и усталость к концу теста.</p>
          <Sequence test={test} seq={a.sequence} />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">Вклад пунктов в результат</h3>
          <div role="group" aria-label="Порядок пунктов" className="inline-flex overflow-hidden rounded-full border border-line print:hidden">
            {(['order', 'impact'] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sort === s}
                onClick={() => setSort(s)}
                className={`min-h-[40px] px-4 text-sm ${sort === s ? 'bg-accent text-accent-fg' : 'bg-surface hover:bg-accent-soft'}`}
              >
                {s === 'order' ? 'По порядку' : 'По вкладу'}
              </button>
            ))}
          </div>
        </div>
        {groups.map((g) => (
          <div key={g.id} className="card space-y-3">
            {groups.length > 1 && <h4 className="font-medium">{g.title}</h4>}
            {g.items.length <= BAR_LIMIT && a.items.length <= TOTAL_LIMIT ? <ItemBars items={g.items} sort={sort} /> : <ItemMatrix items={g.items} />}
          </div>
        ))}
        <p className="text-xs text-muted">
          Вклад — насколько ответ приближает балл шкалы к максимуму с учётом ключа (для обратных пунктов шкала
          инвертирована).
        </p>
      </div>
    </section>
  );
}
