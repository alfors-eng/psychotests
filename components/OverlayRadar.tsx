'use client';
import { useState } from 'react';

export interface OverlaySeries {
  id: string;
  name: string;
  /** Значения по осям, 0–100; null — нет данных. */
  values: (number | null)[];
}

const PALETTE = ['--c-eq', '--c-wellbeing', '--c-relationships', '--c-career', '--c-values', '--c-neurodiversity', '--c-emotional', '--c-personality'];

/**
 * Радар с наложением: жирный контур — итог по всем тестам, тонкие пунктирные — отдельные тесты.
 * Позволяет увидеть, где тесты согласуются, а где расходятся.
 */
export default function OverlayRadar({
  title,
  axes,
  total,
  series,
}: {
  title: string;
  axes: string[];
  total: (number | null)[];
  series: OverlaySeries[];
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const n = axes.length;
  const cx = 210;
  const cy = 190;
  const R = 120;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + R * (v / 100) * Math.cos(a), cy + R * (v / 100) * Math.sin(a)] as const;
  };
  const ring = (f: number) => axes.map((_, i) => pt(i, f * 100).map((v) => v.toFixed(1)).join(',')).join(' ');
  const path = (vals: (number | null)[]) => {
    const pts = vals.map((v, i) => (v === null ? null : pt(i, v)));
    const closed = pts.every(Boolean);
    const d = pts
      .filter(Boolean)
      .map((p, i) => `${i ? 'L' : 'M'}${p![0].toFixed(1)} ${p![1].toFixed(1)}`)
      .join(' ');
    return closed ? `${d} Z` : d;
  };
  const short = (s: string) => (s.length > 22 ? s.slice(0, 21) + '…' : s);
  const summary = axes.map((a, i) => `${a} ${total[i] === null ? 'нет данных' : Math.round(total[i]!) + '%'}`).join(', ');

  return (
    <figure className="space-y-3">
      <figcaption className="font-semibold">{title}</figcaption>
      <svg viewBox="-70 0 560 380" role="img" aria-label={`${title}. Итог: ${summary}.`} className="mx-auto h-auto w-full max-w-md">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={ring(f)} className="fill-none stroke-line" strokeWidth={1} />
        ))}
        {axes.map((_, i) => {
          const [x, y] = pt(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="stroke-line" strokeWidth={1} />;
        })}
        {series.map((s, k) =>
          hidden.has(s.id) ? null : (
            <g key={s.id} style={{ color: `rgb(var(${PALETTE[k % PALETTE.length]}))` }}>
              <path d={path(s.values)} fill="none" stroke="currentColor" strokeWidth={1.8} strokeDasharray="5 4" opacity={0.85} />
              {s.values.map((v, i) => (v === null ? null : <circle key={i} cx={pt(i, v)[0]} cy={pt(i, v)[1]} r={3.2} fill="currentColor" />))}
            </g>
          ),
        )}
        <path d={path(total)} className="fill-accent/25 stroke-accent" strokeWidth={3} strokeLinejoin="round" />
        {total.map((v, i) => (v === null ? null : <circle key={i} cx={pt(i, v)[0]} cy={pt(i, v)[1]} r={5} className="fill-accent" />))}
        {axes.map((label, i) => {
          const [x, y] = pt(i, 100);
          const dx = x - cx;
          const lx = cx + (dx / (R || 1)) * (R + 22);
          const ly = cy + ((y - cy) / (R || 1)) * (R + 22);
          const anchor = dx < -8 ? 'end' : dx > 8 ? 'start' : 'middle';
          return (
            <text key={label} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" className="fill-ink text-[12px]">
              {short(label)}
            </text>
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1">
          <span aria-hidden="true" className="inline-block h-1.5 w-5 rounded-full bg-accent" />
          Итог
        </span>
        {series.map((s, k) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={!hidden.has(s.id)}
            onClick={() =>
              setHidden((h) => {
                const next = new Set(h);
                if (next.has(s.id)) next.delete(s.id);
                else next.add(s.id);
                return next;
              })
            }
            className={`inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 py-1 ${
              hidden.has(s.id) ? 'border-line text-muted line-through' : 'border-line bg-surface'
            }`}
          >
            <span aria-hidden="true" className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: `rgb(var(${PALETTE[k % PALETTE.length]}))` }} />
            {s.name}
          </button>
        ))}
      </div>
    </figure>
  );
}
