import type { ScaleResult } from '@/lib/types';
import { formatValue } from '@/lib/engine';

/** Радар для многошкальных тестов (≥ 3 шкал). Данные дублируются в списке ниже на странице. */
export function RadarChart({ scales }: { scales: ScaleResult[] }) {
  const n = scales.length;
  const cx = 210;
  const cy = 190;
  const R = 120;
  const point = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  const poly = (f: (i: number) => number) =>
    scales.map((_, i) => point(i, R * f(i)).map((v) => v.toFixed(1)).join(',')).join(' ');

  const short = (s: string) => s.replace(/\s*\(.*\)$/, '');

  return (
    <svg
      viewBox="-70 0 560 380"
      role="img"
      aria-label={`Радарная диаграмма: ${scales.map((s) => `${short(s.title)} ${Math.round(s.percent)}%`).join(', ')}`}
      className="mx-auto h-auto w-full max-w-md"
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={poly(() => f)} className="fill-none stroke-line" strokeWidth={1} />
      ))}
      {scales.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="stroke-line" strokeWidth={1} />;
      })}
      <polygon
        points={poly((i) => scales[i].percent / 100)}
        className="fill-accent/25 stroke-accent"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {scales.map((s, i) => {
        const [x, y] = point(i, (R * s.percent) / 100);
        return <circle key={s.id} cx={x} cy={y} r={4} className="fill-accent" />;
      })}
      {scales.map((s, i) => {
        const [x, y] = point(i, R + 22);
        const anchor = x < cx - 8 ? 'end' : x > cx + 8 ? 'start' : 'middle';
        return (
          <text key={s.id} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="fill-ink text-[12px]">
            {short(s.title).length > 20 ? short(s.title).slice(0, 19) + "…" : short(s.title)}
          </text>
        );
      })}
    </svg>
  );
}

/** Горизонтальная полоса для одной шкалы. */
export function ScaleBar({ s }: { s: ScaleResult }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{s.title}</span>
        <span className="tabular-nums text-muted">
          {formatValue(s.value)} <span aria-hidden="true">/</span>
          <span className="sr-only"> из </span> {formatValue(s.max)}
        </span>
      </div>
      <div
        role="meter"
        aria-label={s.title}
        aria-valuemin={s.min}
        aria-valuemax={s.max}
        aria-valuenow={s.value}
        className="h-3 overflow-hidden rounded-full bg-accent-soft"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${s.percent}%` }} />
      </div>
    </div>
  );
}
